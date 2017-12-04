<?php

include_once('./json.php');
include_once('./utils.php');
include_once('./token.php');

if(DEBUG) {
	$json = fetchJSON(JSON_FILE);
	if(!checkPermissions(JSON_FILE, '0777')) {
		$error = errorOutput()->errors[0];
		echo '<div style="font-family:sans-serif">';
		echo '<b style="color:darkred;">ERROR: ' . $error->type . '</b>';
		echo $error->message;
		echo '</div>';
		die;
	}
	fetchGithubData($json);
}

function fetchGithubData($json) {

	$hasErrors = false;

	$ch = curl_init();
	// set URL and other appropriate options
	curl_setopt($ch, CURLOPT_URL, "https://api.github.com/graphql");
	// curl_setopt($ch, CURLOPT_FRESH_CONNECT, TRUE);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_USERAGENT, 'PatchChat');
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		'Authorization:Bearer ' . GITHUB_TOKEN));

	if(PROXY) {
		curl_setopt($ch, CURLOPT_PROXY, PROXY_SERVER);
		curl_setopt($ch, CURLOPT_PROXYPORT, '80');
	}

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	foreach($json as &$repo) {

		$query = <<<QUERY
query {
	repository(owner:"{$repo->owner}", name:"{$repo->name}") {
		id
	  description
	  createdAt
	  url
	  homepageUrl
	  pushedAt
	  releases (last: 10) {
	    edges {
	      node {
	        name
	        description
	        publishedAt
	      }
	    }
	  }
	  mentionableUsers {
	    totalCount
	  }
	  stargazers {
	    totalCount
	  }
	  forks {
	    totalCount
	  }
	  languages (first: 3, orderBy: { field: SIZE, direction: DESC }) {
	    edges {
	      node {
	        name
	      }
	    }
	  }
	}
}
QUERY;

		$query = json_encode(array( 'query' => preg_replace('/\s+/', ' ', $query) ));

		curl_setopt($ch, CURLOPT_POSTFIELDS, $query );

		if(DEBUG) {
			echo '<br><br>';
			echo '<b>Updating ' . $repo->owner . '/' . $repo->name . '</b>';
			echo '<br>';
		}

		$raw = json_decode(curl_exec($ch));
		$errors = $raw->errors;
		$response = $raw->data->repository;

		if(isset($errors) && count($errors) > 0) {
			$hasErrors = true;
			foreach($errors as $error) {
				errorLog($error->type, $error->message);
				if(DEBUG) {
					echo '<div style="font-family:sans-serif;background-color:darkred;color:#fff;padding:10px;">';
					echo '<b>ERROR: ' . $error->type . '</b><br>' . $error->message . '</div>';
				}
			}
			continue;
		}

		$repo->id = $response->id;
		$repo->description = $response->description;
		$repo->createdAt = $response->createdAt;
		$repo->url = $response->url;
		$repo->homepageUrl = $response->homepageUrl;
		$repo->pushedAt = $response->pushedAt;

		$releases = array();
		if(count($response->releases->edges) > 0) :
			foreach($response->releases->edges as $obj) {
				$release = new stdClass();
				$release->name = $obj->node->name;
				$release->description = $obj->node->description;
				$release->publishedAt = $obj->node->publishedAt;
				$releases[] = $release;
			}
		endif;
		$repo->releases = array_reverse($releases);

		$langs = array();
		if(count($response->languages->edges) > 0) :
			foreach($response->languages->edges as $obj) {
				$langs[] = $obj->node->name;
			}
		endif;
		$repo->languages = $langs;

		// to track changes, we put this into a data object
		// in the repo with the key of YEAR-WEEK# (e.g. 2017-24)
		if(!is_object($repo->data)) { $repo->data = new stdClass(); }
		$repo->data->{date('Y-W')} = new stdClass();
		$repo->data->{date('Y-W')}->stars = $response->stargazers->totalCount;
		$repo->data->{date('Y-W')}->users = $response->mentionableUsers->totalCount;
		$repo->data->{date('Y-W')}->forks = $response->forks->totalCount;

		if(DEBUG) echo json_encode($repo, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

	}

	curl_close($ch);

	if(DEBUG) {
		echo '</pre>';
	}

	// if($hasErrors) return errorOutput();
	return $json;
}
