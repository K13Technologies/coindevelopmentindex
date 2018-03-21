<?php

include_once('json.php');
include_once('coin.php');
include_once('utils.php');
include_once('token.php');

define('COINMARKET_LIST', 'https://api.coinmarketcap.com/v1/ticker/?limit=0');

define('SKIP_LIST', array(
	'JINN', 'CRYPTOBNB', 'BTC2X', 'PAYX'
));

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
	fetchCoinMarketData($json);
}

function fetchCoinMarketData($json) {

	$coins = fetchJSON(COINMARKET_LIST);

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	if(!$coins) return $json;

	foreach($json as &$coin) {

		$arr = array_filter($coins, function($item) use($coin) {
			return $item->symbol === $coin->symbol;
		});

		if(count($arr) > 1) {
			$arr = array_filter($arr, function($item) use($coin) {
				return strtolower($item->name) === strtolower($coin->coinname);
			});
		}

		if(count($arr) > 0) {

			$record = array_pop($arr);

			$currData = getTodaysData($coin);
			$currData = setTodaysData($currData, $record ? intval($record->rank) : null, 'rank', 'int', false);
			$currData = setTodaysData($currData, $record ? floatval($record->percent_change_24h) : null, 'volatility');
			$currData = setTodaysData($currData, $record ? floatval($record->price_usd) : null, 'price');

			if(DEBUG) {
				echo '<br><br>';
				var_dump($record);
				ob_flush();
				flush();
			}

		} else {

			if(!in_array($coin->symbol, SKIP_LIST)) {
				errorLog('NOT_FOUND', 'Could not find CoinMarket API data for ' . $coin->symbol);
			}

		}

	}

	if(DEBUG) {
		echo '</pre>';
	}

	// only return errors if this is a single request, eg. from coin-edit
	if(count($json) === 1 && errorOutput()->errors) {
		return errorOutput();
	}

	return $json;
}
