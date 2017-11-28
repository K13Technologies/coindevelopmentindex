<?php

include_once('./json.php');
include_once('./utils.php');
include_once('./token.php');

define('CRYPTOCOMP_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');

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

	$ret = array();

	$coins = (array) fetchJSON(CRYPTOCOMP_LIST)->Data;

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	foreach($json as &$coin) {

		array_push($ret, $coins[$coin->symbol]);

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
