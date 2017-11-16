<?php

	include('./json.php');
	include('./token.php');
	include('./utils.php');

	// check file permissions for updating file
	checkPermissions(REPOS_FILE, '0777');

	$repos = fetchJSON(REPOS_FILE);
	$coins = (array) fetchJSON(COIN_LIST)->Data;

	// DEBUG
	// var_dump($coins);

	echo '<pre>';

	foreach($repos as &$repo) {

		echo 'Searching for <b>' . $repo->name . '/' . $repo->name . '</b>: ';

		// get repo from current json data
		$curr = array_pop(array_filter($coins, function($item) use($repo) {
			return preg_match('/\b' . addcslashes($item->CoinName, '\b/') . '/i', $repo->name);
		}));

		if($curr && !isset($repo->coinname)) {
			echo 'found <b>' . $curr->FullName . '</b> <b style="color:green">&#x2714;</b>';
			$repo->coinname = $curr->CoinName;
			$repo->symbol = $curr->Symbol;
		} else {
			echo ' <b style="background:red;padding:10px;display:inline-block;">NOT FOUND</b>';
		}

		echo '<br><br>';

		ob_flush();
		flush();

	}

	file_put_contents(REPOS_FILE, json_encode($repos, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

	echo '</pre>';
