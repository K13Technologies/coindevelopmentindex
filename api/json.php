<?php

define('JSON_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/data.json');
define('REPOS_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/repos.json');
define('COIN_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');

$json = null;

function fetchJSON($url) {
	global $json;

	$json = json_decode(file_get_contents($url));

	if(json_last_error() !== JSON_ERROR_NONE) {
		throw new Exception('Error reading ' . $url . ' : ' . json_last_error_msg());
	}

	return $json;
}

function getRecord($obj) {
	global $json;

	if($json === null) fetchJSON(JSON_FILE);

	extract($obj);

	if(isset($id)) {
		return getRecordById($id);
	} else if(isset($owner) || isset($name)) {
		return getRecordByName($owner, $name);
	} else {
		return $json;
	}

}

function getRecordById($id) {
	global $json;

	return array_pop(array_filter($json, function($item) use ($id) {
		if(isset($id)) return $item->id === $id;
		else return false;
	}));
}

function getRecordByName($owner, $name) {
	global $json;

	return array_pop(array_filter($json, function($item) use ($owner,$name) {
		if(isset($owner) && isset($name)) return $item->owner === $owner && $item->name === $name;
		elseif(isset($owner)) return $item->owner === $owner;
		elseif(isset($name)) return $item->name === $name;
		else return false;
	}));
}

function addRecords($records) {
	global $json;

	if($json === null) fetchJSON(JSON_FILE);

	$added = array();

	foreach($records as $record) {
		$repo = (object) $record;
		$existing = getRecordByName($repo->owner, $repo->name);
		if($existing) {
				errorLog('REPO_EXISTS', '<br>Repo ' . $existing->owner . '/' . $existing->name . ' already exists');
				return errorOutput();
		}
		$repo->languages = explode(',', $record['languages']);
		$repo->ownername = $record['owner'] . '/' . $record['name'];
		array_push($json, $repo);
		array_push($added, $repo);
	}

	try {
		write($json, JSON_FILE);
		return $added;
	} catch (Exception $e) {
		errorLog('ADDRECORDS_ERROR', $e->getMessage());
		return errorOutput();
	}

}

function updateRecords($records) {
	global $json;

	if($json === null) fetchJSON(JSON_FILE);

	$updated = array();

	foreach($records as $record) {
		$key = array_search($record->id, array_map(function($repo) { return $repo->id; }, $json));
		$json[$key] = (object) array_replace_recursive((array) $record, (array) $vals);
		array_push($updated, $json[$key]);
	}

	if(write($json, JSON_FILE)) {
		return $updated;
	}

}

function write($json, $file) {
	return file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function out($params) {

	$out = json_encode($params);
	header('Content-type: application/json; charset="UTF-8"');
	header('Content-Length: '.strlen($out));
	header('Connection: close');
	echo $out;
	flush();

}
