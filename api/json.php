<?php 

define('JSON_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/data.json');
define('REPOS_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/repos.json');

function fetchJSON($url = "") {

	$url = (strlen($url) > 0) ? $url : JSON_FILE;

	$json = json_decode(file_get_contents($url));

	if(json_last_error() !== JSON_ERROR_NONE) {
		throw new Exception('Error reading ' . $url . ' : ' . json_last_error_msg());
	}

	return $json;
}

function fetchRepos($url = "") {

	$url = (strlen($url) > 0) ? $url : REPOS_FILE;

	$json = json_decode(file_get_contents($url));

	if(json_last_error() !== JSON_ERROR_NONE) {
		throw new Exception('Error reading ' . $url . ' : ' . json_last_error_msg());
	}

	return $json;
}

function out($params) {

	$out = json_encode($params);
	header('Content-type: application/json; charset="UTF-8"');
	header('Content-Length: '.strlen($out));
	header('Connection: close');
	echo $out;
	flush();

}
