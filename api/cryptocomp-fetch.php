<?php

include_once('./json.php');
include_once('./utils.php');
include_once('./token.php');

define('CRYPTOCOMP_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');
define('CRYPTOCOMP_STATS', 'https://www.cryptocompare.com/api/data/socialstats');
define('CRYPTOCOMP_PRICE', 'https://min-api.cryptocompare.com/data/pricemultifull');

if(DEBUG) {
	echo '*******DEBUG MODE*********<br>';
	$json = fetchJSON(JSON_FILE);
	if(!checkPermissions(JSON_FILE, '0777')) {
		$error = errorOutput()->errors[0];
		echo '<div style="font-family:sans-serif">';
		echo '<b style="color:darkred;">ERROR: ' . $error->type . '</b>';
		echo $error->message;
		echo '</div>';
		die;
	}
	if($_GET['service'] === 'data') fetchCryptoCompData($json);
	if($_GET['service'] === 'price') fetchCryptoCompPrice($json);
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

function fetchCryptoCompPrice($json) {

	if(DEBUG) echo '<pre>';

	if(!is_array($json)) {
		$json = array($json);
	}

	$syms = array();
	$pointer = 0;

	for($i = 0; $i < count($json); $i++) {

		if(strlen($json[$i]->symbol) > 0) {
			array_push($syms, $json[$i]->symbol);
		}

		// fetch 10 coins at a time
		if($i % 10 === 0 || $i === count($json) - 1) {

			$prices = fetchJSON(CRYPTOCOMP_PRICE . '?fsyms=' . implode(',', $syms) . '&tsyms=USD');

			for($j = $pointer; $j <= $i; $j++) {

				if(!is_object($json[$j]->price)) { $json[$j]->price = new stdClass(); }
				$json[$j]->price->USD = $prices->RAW->{$json[$j]->symbol}->USD->PRICE;

				if(!is_object($json[$j]->data)) { $json[$j]->data = new stdClass(); }
				if(!is_object($json[$j]->data->{date('Y-W')})) { $json[$j]->data->{date('Y-W')} = new stdClass(); }
				if(!is_object($json[$j]->data->{date('Y-W')}->volatility)) { $json[$j]->data->{date('Y-W')}->volatility = new stdClass(); }
				if(is_object($prices->RAW->{$json[$j]->symbol})) {
					$json[$j]->data->{date('Y-W')}->volatility->{date('w')} = $prices->RAW->{$json[$j]->symbol}->USD->CHANGEPCTDAY;
				}

				if(DEBUG) {
					echo '<br><br>';
					echo $json[$j]->coinname . ' (' . $json[$j]->symbol . ')<br>';
					echo $prices->RAW->{$json[$j]->symbol}->USD->CHANGEPCTDAY;
					// var_dump($prices->RAW->{$json[$j]->symbol});
					ob_flush();
					flush();
				}

			}

			// reset
			$syms = array();
			$pointer = $i + 1;

		}

	}

	if(DEBUG) {
		// echo json_encode($json, JSON_PRETTY_PRINT);
		echo '</pre>';
	}

	return $json;
}
