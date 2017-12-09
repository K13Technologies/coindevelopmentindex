<?php
include_once('./token.php');

define('REMOTE_FILE', 'https://api.myjson.com/bins/909wb');
define('LOCAL_FILE', dirname($_SERVER['DOCUMENT_ROOT']) . '/assets/json/data.json');

define('JSON_FILE', isset($_REQUEST['local']) ? LOCAL_FILE : REMOTE_FILE);

define('DEBUG', $_REQUEST['debug']);
define('PROXY', $_REQUEST['proxy']);

$json = null;

function fetchJSON($url=JSON_FILE) {
	global $json;

	$context = null;

	if(PROXY) {
		$c = array(
	    'http' => array(
	        'proxy' => 	PROXY_SERVER . ':80',
	        'request_fulluri' => true
	    )
		);
		$context = stream_context_create($c);
	}

	$json = sortJSON(json_decode(file_get_contents($url, false, $context)));

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
	} else if(isset($index)) {
		return $json[$index];
	} else if(isset($owner) || isset($name)) {
		return getRecordByName($owner, $name);
	} else if(isset($symbol)) {
		return getRecordBySymbol($symbol);
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

function getRecordBySymbol($symbol) {
	global $json;

	return array_pop(array_filter($json, function($item) use ($symbol) {
		if(isset($symbol)) return $item->symbol === $symbol;
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
		$record->dateAdded = date('c');
		$record->languages = is_array($record->languages) ? $record->languages : explode(',', $record->languages);
		$record->releases = json_decode($record->releases);
		$record->data = json_decode($record->data);
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
		$record->languages = is_array($record->languages) ? $record->languages : explode(',', $record->languages);
		$record->releases = json_decode($record->releases);
		$record->data = json_decode($record->data);
		$json[$idx] = (object) array_replace((array) $json[$idx], (array) $record);
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

function deleteRecord($index) {
		global $json;

	if($json === null) fetchJSON();

	array_splice($json, $index, 1);

	try {
			write($json, JSON_FILE);
			return $json;
		} catch (Exception $e) {
			errorLog('DELETERECORDS_ERROR', $e->getMessage());
			return errorOutput();
		}
}

function sortJSON($json, $prop='owner', $asc=true) {

	if(!is_array($json)) return $json;

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

	if($file === LOCAL_FILE) {

		if(file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
			return json_decode(file_get_contents($file))	;
		}
	}

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
