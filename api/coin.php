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

function setTodaysData($data, $val, $key, $type='float') {

	if(is_null($val)) {
		if(isset($data->{$key})) unset($data->{$key});
		return $data;
	}

	$hr = ceil( (int) date('G') / 4 );

	if($type === 'int') {
		$cma = intval((intval($data->{$key}) + (intval($val) * ($hr - 1))) / $hr);
	} else {
		$cma = round(floatval((floatval($data->{$key}) + (floatval($val) * ($hr - 1))) / $hr), 10);
	}

	$data->{$key} = $cma;

	return $data;

}

function archiveData($coin) {

	$return = new stdClass();
	$return->archive = new stdClass();
	$return->archive->data = array();

	for($i = 0; $i < count($coin->data); $i++) {
		if(strtotime($coin->data[$i]) < strtotime('- 7 days', date('Y-m-d'))) {
			array_push($return->$archive->data, array_splice($coin->data, $i));
		}
	}

	$return->current = $coin;

	return $return;

}
