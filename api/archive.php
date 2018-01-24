<?php

set_include_path('/var/www/coindevelopmentindex.tech/html/');

include_once('utils.php');
include('json.php');

$json = fetchJSON();

if(!checkPermissions(ARCHIVE_FILE, '0775')) {

	$msgs = array_map(function($error) {
					return  PHP_EOL . $error->type . ': ' . $error->message;
				}, errorOutput()->errors);
	// out($msgs);
	logFile('/var/log/coindevelopmentindex/update.log', $msgs);

} else {

	$check = count($json);
	$results = array();

	$data = archive();
	if(!errorOutput()->errors) { array_push($results, 'COINS_ARCHIVE: No errors reported'); }

	$json = $data->current;
	$archive = $data->archive;

	if(count(errorOutput()->errors) > 0) {
		errorLog('ARCHIVE_ERROR',  'Coin count: Was ' . $check . ' coins.  Now ' . count($json) . ' coins');
	} else {
		write($json, JSON_FILE);
		write($archive, ARCHIVE_FILE);
	}

	if(errorOutput()->errors) {
		$msgs = array_map(function($error) {
						return  PHP_EOL . $error->type . ': ' . $error->message;
					}, errorOutput()->errors);
	} else {
		$msgs = array('ARCHIVE_COMPLETE: No errors reported');
	}

	// out(array_merge($results, $msgs));
	logFile('/var/log/coindevelopmentindex/update.log', array_merge($results, $msgs));

}

