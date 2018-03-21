<?php

	set_include_path('/var/www/coindevelopmentindex.tech/html/');

	include_once('utils.php');
	include('json.php');

	if(!checkPermissions(dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'backup', '0755')) {
		$msgs = array_map(function($error) {
						return  PHP_EOL . $error->type . ': ' . $error->message;
					}, errorOutput()->errors);
		logFile('/var/log/coindevelopmentindex/update.log', $msgs);
	} else {
		backup('archive', ARCHIVE_FILE);
		backup('data', JSON_FILE);
		if(errorOutput()->errors) {
			$msgs = array_map(function($error) {
							return  $error->type . ': ' . $error->message;
						}, errorOutput()->errors);
		} else {
			$msgs = array('BACKUP_COMPLETE: No errors reported');
		}
		logFile(LOG_FILE, $msgs);
	}
