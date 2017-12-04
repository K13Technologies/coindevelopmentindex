<?php

include_once('./json.php');
include_once('./utils.php');
include_once('./token.php');

define('CRYPTOCOMP_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');
define('CRYPTOCOMP_STATS', 'https://www.cryptocompare.com/api/data/socialstats');

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
	fetchCryptoCompData($json);
}


function fetchCryptoCompData($json) {

	$coins = (array) fetchJSON(CRYPTOCOMP_LIST)->Data;

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	foreach($json as &$coin) {

		$record = array_pop(array_filter($coins, function($item) use($coin) {
			return $item->Symbol === $coin->symbol;
		}));

		if($record) {
			$stats = fetchJSON(CRYPTOCOMP_STATS . '?id=' . $record->Id);
			return $stats;
		}

		if(DEBUG) {
			echo '<br><br>';
			var_dump($coins[$coin->symbol]);
			ob_flush();
			flush();
		}

	}

	if(DEBUG) {
		echo '</pre>';
	}

	return $ret;
}
