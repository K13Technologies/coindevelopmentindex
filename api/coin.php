<?php

function initializeData($coin) {
	// to track changes, store KPIs into an array of data objects
	// in the coin with a date key of YEAR-MO-DY (e.g. 2017-12-24)
	if(!is_array($coin->data)) { $coin->data = array(); }

	return $coin;
}

function getTodaysData($coin) {

	$coin = initializeData($coin);

	$arr = array_filter($coin->data, function($d) {
		return $d->date === date('Y-m-d');
	});

	$currDate = array_pop($arr);

	if(count($currDate) === 0) {
		$currDate = new stdClass();
		$currDate->date = date('Y-m-d');
		array_unshift($coin->data, $currDate);
	}

	return $currDate;
}
