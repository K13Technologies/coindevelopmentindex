<?php

	include('./json.php');
	include('./token.php');
	include('./utils.php');

	// check file permissions for updating file
	checkPermissions(JSON_FILE, '0777');

	$repos = fetchJSON(REPOS_FILE);
	$json = fetchJSON(JSON_FILE);

	$out = new stdClass();
	$ch = curl_init();

	// set URL and other appropriate options
	curl_setopt($ch, CURLOPT_URL, "https://api.github.com/graphql");
	// curl_setopt($ch, CURLOPT_FRESH_CONNECT, TRUE);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_USERAGENT, 'PatchChat');
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		'Authorization:Bearer ' . GITHUB_TOKEN));

	if($_GET['proxy']) {
		curl_setopt($ch, CURLOPT_PROXY, PROXY_SERVER);
		curl_setopt($ch, CURLOPT_PROXYPORT, '80');
	}

	echo '<pre>';

	foreach($repos as &$repo) {

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

		// DEBUG
		// echo '<br><b>QUERY:</b><br>' . $query;

		curl_setopt($ch, CURLOPT_POSTFIELDS, $query );

		echo '<br><br>';
		echo '<b>Updating ' . $repo->owner . '/' . $repo->name . '</b>';
		echo '<br>';

		// get repo from current json data
		$curr = array_pop(array_filter($json, function($item) use($repo) {
			return $item->owner === $repo->owner && $item->name === $repo->name;
		}));

		if($curr) {
			echo 'Found existing data to update.<br>';
			$repo = $curr;
		}

		$raw = json_decode(curl_exec($ch));
		$errors = $raw->errors;
		$response = $raw->data->repository;

		// DEBUG
		// var_dump($raw);

		if(isset($errors) && count($errors) > 0) {
			foreach($errors as $error) {
				echo '<b style="display:block;background-color:red;padding:10px;">' . $error->type . ': ' . $error->message . '</b>';
			}
			ob_flush();
			flush();
			continue;
		}

		$repo->id = $response->id;
		$repo->description = $response->description;
		$repo->createdAt = $response->createdAt;
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

		echo json_encode($repo, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

		ob_flush();
		flush();

	}

	curl_close($ch);

	echo '</pre>';

	file_put_contents(JSON_FILE, json_encode($repos, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

?>
