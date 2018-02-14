<?php

	include_once('utils.php');
	include('json.php');

	$json = fetchJSON(JSON_FILE);
	$csvarr = fetchCSV(CSV_FILE);
	$fieldsarr = fetchJSON(FIELDS_FILE);

	$fields = array_map(function($field) {
							return $field->name;
						}, $fieldsarr);

	foreach($json as &$coin) {

		$data = getCSVrecord($coin->symbol, $csvarr);

		if(!$data) continue;

		foreach($data as $key => $val) {

			$fieldarr = array_filter($fieldsarr, function($f) use($key) {
				return $f->name === $key;
			});

			$field = count($fieldarr) > 0 ? array_pop($fieldarr) : null;

			if(!$field) continue;

			$val = $field->type === 'number' ? floatval($val) : $val;

			if(!isset($coin->{$key}) && ((is_string($val) && strlen($val) > 0) 
							|| (is_numeric($val) && $val > 0)) ) {

				$coin->{$key} = $val;

			} else if(isset($coin->{$key}) && $coin->{$key} != $val
									&& ((is_string($val) && strlen($val) > 0) 
												|| (is_numeric($val) && $val > 0)) ) {
				// $coin->{$key} = $val;
			}

		}
	}

	out($json);
	// out(write($json, JSON_FILE));
