<?php

	include_once('utils.php');
	include('json.php');
	include('github-fetch.php');
	include('cryptocomp-fetch.php');
	include('coinmarket-fetch.php');


	$json = fetchJSON(LOCAL_FILE);
	// $releases = new stdClass();

	foreach($json as &$coin) {

		// $releases->{$coin->symbol} = $coin->releases;
		// unset($coin->releases);
		// usort($coin->data, function($a, $b) {
		// 	return strcmp($b->date, $a->date);
		// });

	}

	// out(write($releases, dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'releases.json'));
	// out(write($json, LOCAL_FILE));

	// phpinfo();
