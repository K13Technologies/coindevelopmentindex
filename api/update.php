<?php

	set_include_path('/var/www/coindevelopmentindex.tech/html/');

	include_once('utils.php');
	include('json.php');
	include('github-fetch.php');
	include('cryptocomp-fetch.php');
	include('coinmarket-fetch.php');

	$json = fetchJSON();

	$check = count($json);
	$results = array();

	$json = fetchCoinMarketData($json);
	if(!errorOutput()->errors) { array_push($results, 'COINMARKET_UPDATE: No errors reported'); }
	$json = fetchGithubData($json, true);
	if(!errorOutput()->errors) { array_push($results, 'GITHUB_UPDATE: No errors reported'); }
	$json = fetchCryptoCompPrice($json);
	if(!errorOutput()->errors) { array_push($results, 'CRYPTOCOMPARE_UPDATE: No errors reported'); }

	if(count(errorOutput()->errors) > 0) {
		errorLog('UPDATE_ERROR',  'Coin count: Was ' . $check . ' coins.  Now ' . count($json) . ' coins');
	} else {
		write($json, JSON_FILE);
	}

	if(errorOutput()->errors) {
		$msgs = array_map(function($error) {
						return  PHP_EOL . $error->type . ': ' . $error->message;
					}, errorOutput()->errors);
	} else {
		$msgs = array('UPDATE_COMPLETE: No errors reported');
	}
	logFile('/var/log/coindevelopmentindex/update.log', array_merge($results, $msgs));

