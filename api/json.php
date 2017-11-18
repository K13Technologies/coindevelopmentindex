<?php
include_once('./token.php');

define('REMOTE_FILE', 'https://api.myjson.com/bins/909wb');
define('LOCAL_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/data.json');
define('JSON_FILE', REMOTE_FILE);
define('COIN_LIST', 'https://min-api.cryptocompare.com/data/all/coinlist');

$json = null;

function fetchJSON($url=JSON_FILE) {
	global $json;

	$json = json_decode(file_get_contents($url));

	if(json_last_error() !== JSON_ERROR_NONE) {
		throw new Exception('Error reading ' . $url . ' : ' . json_last_error_msg());
	}

	return $json;
}

function getRecord($obj) {
	global $json;

	if($json === null) fetchJSON();

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

	if($json === null) fetchJSON();

	$added = array();

	foreach($records as $record) {
		$repo = (object) $record;
		$existing = getRecordByName($repo->owner, $repo->name);
		if($existing) {
				errorLog('REPO_EXISTS', '<br>Repo ' . $existing->owner . '/' . $existing->name . ' already exists');
				return errorOutput();
		}
		$repo->languages = explode(',', $record->languages);
		$repo->ownername = $record->owner . '/' . $record->name;
		array_push($json, $repo);
		array_push($added, $repo);
	}

	try {
		write(sortJSON($json), JSON_FILE);
		return $added;
	} catch (Exception $e) {
		errorLog('ADDRECORDS_ERROR', $e->getMessage());
		return errorOutput();
	}

}

function updateRecords($records) {
	global $json;

	if($json === null) fetchJSON();

	$updated = array();

	foreach($records as $record) {
		$idx = array_search($record->id, array_map(function($repo) { return $repo->id; }, $json));
		$json[$idx] = (object) array_replace_recursive((array) $json[$idx], (array) $record);
		array_push($updated, $json[$idx]);
	}

	try {
		write($json, JSON_FILE);
		return $updated;
	} catch (Exception $e) {
		errorLog('UPDATERECORDS_ERROR', $e->getMessage());
		return errorOutput();
	}

}

function sortJSON($json, $prop='owner', $asc=true) {

	usort($json, function($a, $b) use($prop,$asc) {
		if(is_numeric($prop)) {
			if($a->$prop === $b->$prop) return 0;
			if($asc) return $a->$prop > $b->$prop ? 1 : -1;
			else return $a->$prop < $b->$prop ? 1 : -1;
		}
		else return $asc ? strcasecmp($a->$prop, $b->$prop) : strcasecmp($b->$prop, $a->$prop);
	});

	return $json;

}

function write($json, $file) {

	$data_json = json_encode($json);
	// return file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $file);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json','Content-Length: ' . strlen($data_json)));
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
	curl_setopt($ch, CURLOPT_POSTFIELDS,$data_json);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	if($_REQUEST['proxy']) {
		curl_setopt($ch, CURLOPT_PROXY, PROXY_SERVER);
		curl_setopt($ch, CURLOPT_PROXYPORT, '80');
	}

	$reponse = curl_exec($ch);
	curl_close($ch);

	return $reponse;
}

function out($params) {

	$out = json_encode($params);
	header('Content-type: application/json; charset="UTF-8"');
	header('Content-Length: '.strlen($out));
	header('Connection: close');
	echo $out;
	flush();

}
