<?php

	include_once('utils.php');
	include('json.php');

	$json = fetchJSON(JSON_FILE);
	$csvarr = fetchCSV(CSV_FILE);
	$fieldsarr = fetchJSON(FIELDS_FILE);
	$newrecords = array();
	$updated = 0;

	$fields = array_map(function($field) {
							return $field->name;
						}, $fieldsarr);

	foreach($json as &$coin) {

		$data = getCSVrecord($coin->symbol, $csvarr);
		$hasUpdate = false;

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
				$hasUpdate = true;

			} else if(isset($coin->{$key}) && $coin->{$key} != $val
									&& ((is_string($val) && strlen($val) > 0) 
												|| (is_numeric($val) && $val > 0)) ) {
				// $coin->{$key} = $val;
				// $hasUpdate = true;
			}

		}

		if($hasUpdate) $updated++;
	}

	foreach($csvarr as $csv) {

		$data = getRecord(array('symbol' => $csv->symbol));

		if($data) continue;

		array_push($newrecords, $csv);

	}

	write($json, JSON_FILE);
	addRecords($newrecords);

	if(errorOutput()->errors) {
		errorLog('IMPORT_COMPLETE',  'Completed with ' . count(errorOutput()->errors) . ' errors');
		$msgs = array_map(function($error) {
						return  $error->type . ': ' . $error->message;
					}, errorOutput()->errors);
	} else {
		$msgs = array('IMPORT_COMPLETE: Added ' . count($newrecords) . ' new records.  Updated ' . $updated . ' records.');
	}

	out($msgs);
	// out(write($json, JSON_FILE));
