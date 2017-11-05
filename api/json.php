<?php

define('JSON_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/data.json');
define('REPOS_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/repos.json');
define('COIN_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');

$cache = new stdClass();

function fetchJSON($url) {
	global $cache;

	if(isset($cache->{$url})) return $cache->{$url};

	$json = json_decode(file_get_contents($url));

	if(json_last_error() !== JSON_ERROR_NONE) {
		throw new Exception('Error reading ' . $url . ' : ' . json_last_error_msg());
	}

	$cache->{$url} = $json;

	return $json;
}

function getRecord($owner,$name) {

	$json = fetchJSON(JSON_FILE);

	if(isset($owner) || isset($name)) {
		out(getRecordByName($json, $owner, $name));
	} else {
		out($json);
	}

}

function getRecordByName($json, $owner, $name) {
	return array_filter($json, function($item) use ($owner,$name) {
		if(isset($owner) && isset($name)) return $item->owner === $owner && $item->name === $name;
		elseif(isset($owner)) return $item->owner === $owner;
		elseif(isset($name)) return $item->name === $name;
		else return false;
	});
}

function updateRecord($id, $vals) {

	$record = fetchJSON(JSON_FILE);

}

function out($params) {

	$out = json_encode($params);
	header('Content-type: application/json; charset="UTF-8"');
	header('Content-Length: '.strlen($out));
	header('Connection: close');
	echo $out;
	flush();

}
