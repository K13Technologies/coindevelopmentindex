<?php

	include('./json.php');
	include('./token.php');

	$repos = fetchJSON(REPOS_FILE);
	$json = fetchJSON(JSON_FILE);
	$out = new stdClass();
	$ch = curl_init();

	// set URL and other appropriate options
	curl_setopt($ch, CURLOPT_URL, "https://api.github.com/graphql");
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

	foreach($repos as $repo) {

		// if(!array_filter($json, function())


		$query = <<<QUERY

query {
  repository(owner:"{$repo->owner}", name:"{$repo->name}") {
  	id
    description
    createdAt
    homepageUrl
    pushedAt
    stargazers {
      totalCount
    }
    mentionableUsers {
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

		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array( 'query' => $query )));

		echo '<br><br>';
		echo 'Updating ' . $repo->owner . '/' . $repo->name;
		echo '<br>';

		$raw = json_decode(stripslashes(curl_exec($ch)));
		$errors = $raw->errors;
		$response = $raw->data->repository;

		if(isset($errors)) {
			foreach($errors as $error) {
				echo '<b style="color:red;">' . $error->type . ':</b> ' . $error->message;
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

		$langs = array();
		foreach($response->languages->edges as $obj) {
			$langs[] = $obj->node->name;
		}
		$repo->languages = $langs;

		// to track changes, we put this into a data object
		// in the repo with the key of YEAR-WEEK# (e.g. 2017-24)
		$repo->data{date('Y-W')} = new stdClass();
		$repo->data{date('Y-W')}->stars = $response->stargazers->totalCount;
		$repo->data{date('Y-W')}->users = $response->mentionableUsers->totalCount;

		echo json_encode($repo, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

		ob_flush();
		flush();

	}
		
	curl_close($ch);

	echo '</pre>';

	file_put_contents(JSON_FILE, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

?>