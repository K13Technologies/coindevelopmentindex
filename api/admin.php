<?php

	include_once('utils.php');
	include('json.php');
	// include('github-fetch.php');
	// include('cryptocomp-fetch.php');
	// include('coinmarket-fetch.php');

	$archive = getArchive(); // 14d default

	$json = fetchJSON();

	foreach($json as &$coin) {

		$idx = array_search($coin->symbol, array_map(function($c) { return $c->symbol; }, $archive));

			foreach($archive[$idx]->data as $day) {
				if(array_search($day->date, array_map(function($d) { return $d->date; }, $coin->data)) === false) {
					array_push($coin->data, $day);
				}
			}
			usort($coin->data, function($a, $b) {
				return strcmp($b->date, $a->date);
			});

	}

	out($json);
	// out(write($releases, dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'releases.json'));
	// out(write($json, LOCAL_FILE));
