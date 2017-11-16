<?php

$output = new stdClass();
$output->errors = array();

function checkPermissions($file, $mod) {

	// check file permissions for updating file
	$perms = substr(sprintf('%o', fileperms($file)), -4);

	if($perms !== $mod) {
		$message = '<br>Incorrect permissions on ' . $file;
		$message .= '<br>Permissions are: ' . $perms . ', but should be ' . $mod . ' </b>';
		$message .= '<br><br>To fix, enter the the following command in Terminal:';
		$message .= '<br><br><pre style="padding:3px;background:#fff">sudo chmod ' . $mod . ' ' . $file . '</pre>';

		errorLog('FILE_PERMISSIONS', $message);

		return false;

	} else {
		return true;
	}
}

function errorLog($type, $message) {

	global $output;

	$error = new stdClass();
	$error->type = $type;
	$error->message = $message;

	array_push($output->errors, $error);

}

function errorOutput() {

	global $output;

	return $output;

}
