<?php

include_once('json.php');
include_once('coin.php');
include_once('utils.php');
include_once('token.php');

if(DEBUG) {
	echo '*******DEBUG MODE*********<br>';
	$json = array_slice(fetchJSON(JSON_FILE), 0, 10);
	if(errorOutput()->errors) var_dump(errorOutput()->errors);
	if(!checkPermissions(JSON_FILE, '0664')) {
		$error = errorOutput()->errors[0];
		echo '<div style="font-family:sans-serif">';
		echo '<b style="color:darkred;">ERROR: ' . $error->type . '</b>';
		echo $error->message;
		echo '</div>';
		die;
	}
	fetchGithubData($json);
}

function fetchGithubData($json, $bulk=false) {

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

	foreach($json as &$coin) {

		if(!isset($coin->owner) || !isset($coin->name)) continue;
		if(strlen($coin->owner) === 0 || strlen($coin->name) === 0) continue;

		$query = <<<QUERY
query {
	repository(owner:"{$coin->owner}", name:"{$coin->name}") {
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
			echo '<b>Updating ' . $coin->owner . '/' . $coin->name . '</b>';
			echo '<br>';
		}

		$raw = json_decode(curl_exec($ch));

		if(!$raw) { continue; }

		$errors = isset($raw->errors) ? $raw->errors : false;
		$response = $raw->data->repository;

		if($errors && count($errors) > 0) {
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

		// only set these if we're in coin-edit so that
		// they can be reverted if necessary,  prevent
		// overwriting of manually entered data
		if(!$bulk) {
			$coin->id = $response->id;
			$coin->description = $response->description;
			$coin->createdAt = $response->createdAt;
			$coin->url = $response->url;
			$coin->homepageUrl = $response->homepageUrl;
			$coin->pushedAt = $response->pushedAt;

			$langs = array();
			if(count($response->languages->edges) > 0) :
				foreach($response->languages->edges as $obj) {
					$langs[] = $obj->node->name;
				}
			endif;
			$coin->languages = $langs;
		}

		$currData = getTodaysData($coin);
		$currData = setTodaysData($currData, $response->stargazers->totalCount, 'stars', 'int');
		$currData = setTodaysData($currData, $response->mentionableUsers->totalCount, 'users', 'int');
		$currData = setTodaysData($currData, $response->forks->totalCount, 'forks', 'int');

		// $releases = array();
		// if(count($response->releases->edges) > 0) :
		// 	foreach($response->releases->edges as $obj) {
		// 		$release = new stdClass();
		// 		$release->name = $obj->node->name;
		// 		$release->description = $obj->node->description;
		// 		$release->publishedAt = $obj->node->publishedAt;
		// 		$releases[] = $release;
		// 	}
		// endif;
		// $coin->releases = array_reverse($releases);

		if(DEBUG) echo json_encode($coin, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

	}

	curl_close($ch);

	if(DEBUG) {
		echo '</pre>';
	}

	// only return errors if it is a single fetch
	if(!$bulk && $hasErrors) return errorOutput();
	return $json;
}
