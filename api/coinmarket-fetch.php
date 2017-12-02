<?php

include_once('./json.php');
include_once('./utils.php');
include_once('./token.php');

define('COINMARKET_LIST', 'https://api.coinmarketcap.com/v1/ticker/');

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
	fetchCoinMarketData($json);
}

function fetchCoinMarketData($json) {

	$ret = array();

	$coins = fetchJSON(COINMARKET_LIST);

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	foreach($json as &$coin) {

		$record = array_pop(array_filter($coins, function($item) use($coin) {
			return $item->symbol === $coin->symbol;
		}));

		if($record) {
			$record->coinname = $record->name;

			// prevent override of repo.id, repo.name
			unset($record->id);
			unset($record->name);

			array_push($ret, $record);
		}

		if(DEBUG) {
			echo '<br><br>';
			var_dump($record);
			ob_flush();
			flush();
		}

	}

	if(DEBUG) {
		echo '</pre>';
	}

	return $ret;
}
