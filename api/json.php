<?php
include_once('token.php');
include_once('coin.php');

define('DEVELOPMENT', @preg_match('/(api\.)?coindev\.local/', $_SERVER['SERVER_NAME']));
define('DEBUG', isset($_REQUEST['debug']));
define('PROXY', isset($_REQUEST['proxy']));

if(DEVELOPMENT) {
	define('FS_ROOT', dirname($_SERVER['DOCUMENT_ROOT']));
} else {
	define('FS_ROOT', $_SERVER['DOCUMENT_ROOT'] !== '' ? $_SERVER['DOCUMENT_ROOT'] : '/var/www/coindevelopmentindex.tech/html');
}

define('REMOTE_FILE', 'https://api.coindevelopmentindex.tech');
define('LOCAL_FILE', FS_ROOT . '/assets/json/data.json');
define('ARCHIVE_FILE', FS_ROOT . '/assets/json/data.archive.json');
define('FIELDS_FILE', FS_ROOT . '/assets/json/form-fields.json');

if(DEVELOPMENT) {
	define('JSON_FILE', isset($_REQUEST['local']) ? LOCAL_FILE : REMOTE_FILE);
} else {
	define('JSON_FILE', LOCAL_FILE);
}

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

	try {
		$data = @file_get_contents($url, false, $context);
		if(!$data) {
			errorLog('FETCH_JSON_ERROR',
				isset($data->Message) ? $data->Message : 'Possible network error.  You may need to add the <pre style="display:inline;padding:5px;background:#fff">?proxy</pre> flag to your url if you are on VPN.');
			$return = false;
		} else {
			$return = sortJSON(json_decode($data));
		}
		if($url === JSON_FILE) {
			$json = $return;
		}
		if(json_last_error() !== JSON_ERROR_NONE) {
			errorLog('FETCH_JSON_ERROR','Error reading ' . $url . ' : ' . json_last_error_msg());
			$return = false;
		}
	} catch (Exception $e) {
		errorLog('FETCH_JSON_ERROR', $e->getMessage());
		$return = false;
	}

	return $return;

}

function getRecord($obj) {
	global $json;

	if($json === null) fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	extract($obj);

	if(isset($index)) {
		return $json[$index];
	}
	if(isset($symbol)) {
		return getRecordBySymbol($symbol);
	}
	if(isset($id)) {
		return getRecordById($id);
	}
	if(isset($owner) || isset($name)) {
		return getRecordByName($owner, $name);
	}
	return $json;

}

function getRecordById($id) {
	global $json;

	$arr = array_filter($json, function($item) use ($id) {
		if(isset($id)) return $item->id === $id;
		else return false;
	});

	return array_pop($arr);
}

function getRecordBySymbol($symbol) {
	global $json;

	$arr = array_filter($json, function($item) use ($symbol) {
		if(isset($symbol)) return $item->symbol === $symbol;
		else return false;
	});

	return array_pop($arr);
}

function getRecordByName($owner, $name) {
	global $json;

	$arr = array_filter($json, function($item) use ($owner,$name) {
		if(isset($owner) && isset($name)) return $item->owner === $owner && $item->name === $name;
		elseif(isset($owner)) return $item->owner === $owner;
		elseif(isset($name)) return $item->name === $name;
		else return false;
	});

	return array_pop($arr);
}

function addRecords($records) {
	global $json;

	if($json === null) fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	$fields = array_map(function($field) {
							return $field->name;
						}, fetchJSON(FIELDS_FILE));

	$added = array();

	foreach($records as $record) {

		$coin = (object) $record;

		$existing = getRecordBySymbol($coin->symbol);
		if($existing) {
				errorLog('COIN_EXISTS', '<br>Coin ' . $existing->coinname . ' (' . $existing->symbol . ') already exists');
				return errorOutput();
		}

		$coin->dateAdded = date('c');
		$coin->languages = is_array($record->languages) ? $record->languages : explode(',', $record->languages);
		$coin->releases = json_decode($record->releases);
		$coin->data = json_decode($record->data);

		foreach($coin as $key => $val) {
			if(!in_array($key, $fields)) {
				unset($coin->{$key});
			}
		}

		array_push($json, $coin);
		array_push($added, $coin);
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
	if(errorOutput()->errors) return errorOutput();

	$fields = array_map(function($field) {
							return $field->name;
						}, fetchJSON(FIELDS_FILE));

	$updated = array();

	foreach($records as $record) {

		$idx = array_search($record->symbol, array_map(function($coin) { return $coin->symbol; }, $json));

		$record->languages = is_array($record->languages) ? $record->languages : explode(',', $record->languages);
		// $record->releases = json_decode($record->releases);
		$record->data = json_decode($record->data);

		foreach($record as $key => $val) {
			if(!in_array($key, $fields)) {
				unset($record->{$key});
			}
		}

		$json[$idx] = (object) array_replace((array) $json[$idx], (array) $record);
		array_push($updated, $json[$idx]);

	}

	try {
		write($json, JSON_FILE);
		if(errorOutput()->errors) return errorOutput()->errors;
		return $updated;
	} catch (Exception $e) {
		errorLog('UPDATERECORDS_ERROR', $e->getMessage());
		return errorOutput();
	}

}

function deleteRecord($index) {
	global $json;

	if($json === null) fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	array_splice($json, $index, 1);

	try {
			write($json, JSON_FILE);
			return $json;
		} catch (Exception $e) {
			errorLog('DELETERECORDS_ERROR', $e->getMessage());
			return errorOutput();
		}
}

function sortJSON($json, $prop='coinname', $asc=true) {

	if(!is_array($json)) return $json;

	usort($json, function($a, $b) use($prop,$asc) {
		if(@is_numeric($a->$prop)) {
			if($a->$prop === $b->$prop) return 0;
			if($asc) return $a->$prop > $b->$prop ? 1 : -1;
			else return $a->$prop < $b->$prop ? 1 : -1;
		}
		else return $asc ? @strcasecmp($a->$prop, $b->$prop) : @strcasecmp($b->$prop, $a->$prop);
	});

	return $json;

}

function write($json, $file, $flags=0) {

	$data_json = json_encode($json, $flags);

	if($file === LOCAL_FILE || DEVELOPMENT) {

		if(file_put_contents($file, $data_json)) {
			return json_decode(file_get_contents($file));
		}
	}

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $file);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json','Content-Length: ' . strlen($data_json)));
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
	curl_setopt($ch, CURLOPT_POSTFIELDS,$data_json);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	if(PROXY) {
		curl_setopt($ch, CURLOPT_PROXY, PROXY_SERVER);
		curl_setopt($ch, CURLOPT_PROXYPORT, '80');
	}

	$reponse = curl_exec($ch);
	curl_close($ch);

	return $reponse;
}

function archive() {
	// global $json;

	$data = new stdClass();
	$data->current = array();

	// if($json === null)
	$json = fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	$jsonarchive = fetchJSON(ARCHIVE_FILE);
	if(errorOutput()->errors) return errorOutput();

	foreach($json as $coin) {

		$idx = array_search($coin->symbol, array_map(function($c) { return $c->symbol; }, $jsonarchive));

		$cdata = archiveData($coin);

		$cdata->archive->coinname = $coin->coinname;
		$cdata->archive->symbol = $coin->symbol;

		if($idx !== false) {
			foreach(array_reverse($cdata->archive->data) as $day) {
				if(array_search($day->date, array_map(function($d) { return $d->date; }, $jsonarchive[$idx]->data)) === false) {
					array_unshift($jsonarchive[$idx]->data, $day);
				}
			}
		} else {
			array_push($jsonarchive, $cdata->archive);
		}

		array_push($data->current, $cdata->current);

	}

	$data->archive = $jsonarchive;

	return $data;

}

function backup() {
	global $json;

	$filename = DEVELOPMENT ? 'data.' . date('Ymd') . '.backup.json' : 'backup';

	$file = dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'backup' . DIRECTORY_SEPARATOR . $filename;

	if($json === null) fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	if(file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
		return json_decode(file_get_contents($file));
	} else {
		errorLog('BACKUP_JSON_ERROR', 'Unable to create ' . $file);
		return errorOutput();
	}

}

function out($params) {

	$out = json_encode($params);
	header('Content-type: application/json; charset="UTF-8"');
	header('Content-Length: '.strlen($out));
	header('Connection: close');
	echo $out;
	flush();

}
