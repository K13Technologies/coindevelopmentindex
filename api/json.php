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
define('DEV_FILE', FS_ROOT . '/assets/json/data.dev.json');
define('FIELDS_FILE', FS_ROOT . '/assets/json/form-fields.json');
define('CSV_FILE', FS_ROOT . '/assets/json/coin_data_2018.csv');

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
				isset($data->Message) ? $data->Message : 'Error with file_get_contents. Could not fetch file: ' . $url);
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

function fetchCSV($file=CSV_FILE) {

	$array = array_map('str_getcsv', file($file));

	$header = array_shift($array);

	array_walk($array, '_combine_array', $header);

	return $array;

}

function _combine_array(&$row, $key, $header) {
	array_walk($row, '_convert_utf8');
  $row = (object) array_combine($header, $row);
}

function _convert_utf8(&$str) {
	$str = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
}

function getCSVrecord($sym, $arr) {

	$records = array_filter($arr, function($item) use($sym) {
		return $item->symbol === $sym;
	});

	return array_pop($records);
}

function getRecord($obj, $full=false) {
	global $json;

	if($json === null) fetchJSON();
	if(errorOutput()->errors) return errorOutput();

	extract($obj);

	if(isset($index)) {
		return $json[$index];
	}
	if(isset($symbol)) {
		return getRecordBySymbol($symbol, $full);
	}
	if(isset($id)) {
		return getRecordById($id, $full);
	}
	if(isset($owner) || isset($name)) {
		return getRecordByName($owner, $name, $full);
	}
	return $json;

}

function getRecordById($id, $full=false) {
	global $json;

	$arr = array_filter($json, function($item) use ($id) {
		if(isset($id)) return $item->id === $id;
		else return false;
	});

	$record = array_pop($arr);

	if($full) {
		$devdata = fetchJSON(DEV_FILE);
	}
}

function getRecordBySymbol($symbol, $full=false) {
	global $json;

	$arr = array_filter($json, function($item) use ($symbol) {
		if(isset($symbol)) return $item->symbol === $symbol;
		else return false;
	});

	return array_pop($arr);
}

function getRecordByName($owner, $name, $full=false) {
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
		// $coin->releases = json_decode($record->releases);
		$coin->data = isset($record->data) ? json_decode($record->data) : array();

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
	$changedkeys = array();

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

		// if the coinname or symbol changed, we need to update
		// refs in aux data files...
		if($record->coinname !== $json[$idx]->coinname ||
			 $record->symbol !== $json[$idx]->symbol) {
			$changedkeys[$json[$idx]->symbol] = $record;
		}

		$json[$idx] = (object) array_replace((array) $json[$idx], (array) $record);
		array_push($updated, $json[$idx]);

	}

	try {
		write($json, JSON_FILE);
		if(count($changedkeys) > 0) {
			write(updateRelatedFile(ARCHIVE_FILE, $changedkeys), ARCHIVE_FILE);
			// write(updateRelatedFile(DEV_FILE, $changedkeys), DEV_FILE);
		}
		if(errorOutput()->errors) return errorOutput();
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

	if(file_put_contents($file, $data_json)) {

		return json_decode(file_get_contents($file));

	} else {

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
}

function archive($file=JSON_FILE) {

	$data = new stdClass();
	$data->current = array();

	$json = fetchJSON($file);
	if(errorOutput()->errors) return errorOutput();

	$jsonarchive = fetchJSON(ARCHIVE_FILE);
	if(errorOutput()->errors) return errorOutput();

	foreach($json as $coin) {

		$idx = array_search($coin->symbol, array_map(function($c) { return $c->symbol; }, $jsonarchive));

		$cdata = archiveData($coin);

		$cdata->archive->coinname = $coin->coinname;
		$cdata->archive->symbol = $coin->symbol;

		if($idx !== false) {
			foreach($cdata->archive->data as $day) {
				if(array_search($day->date, array_map(function($d) { return $d->date; }, $jsonarchive[$idx]->data)) === false) {
					array_push($jsonarchive[$idx]->data, $day);
				}
			}
			usort($jsonarchive[$idx]->data, function($a, $b) {
				return strcmp($b->date, $a->date);
			});
		} else {
			usort($cdata->archive->data, function($a, $b) {
				return strcmp($b->date, $a->date);
			});
			array_push($jsonarchive, $cdata->archive);
		}


		array_push($data->current, $cdata->current);

	}

	$data->archive = $jsonarchive;

	return $data;

}

function getArchive($file=ARCHIVE_FILE, $from=null, $to=null) {

	$data = array();

	$from = $from ? $from : strtotime('-14 days');
	$to = $to ? $to : time();

	$jsonarchive = fetchJSON($file);
	if(errorOutput()->errors) return errorOutput();

	foreach($jsonarchive as &$coin) {

		$coin->data = array_filter($coin->data, function($day) use($from, $to) {
			$t = strtotime($day->date);
			return $t >= $from && $t <= $to;
		});

	}

	return $jsonarchive;

}

function updateRelatedFile($file, $records) {

	$json = fetchJSON($file);
	if(errorOutput()->errors) return errorOutput();

	foreach($records as $sym => $newrecord) {

		$idx = array_search($sym, array_map(function($coin) { return $coin->symbol; }, $json));

		$json[$idx]->coinname = $newrecord->coinname;
		$json[$idx]->symbol = $newrecord->symbol;

	}

	return $json;
}

function backup($name, $src) {

	$filename = DEVELOPMENT ? $name . '.' . date('Ymd') . '.backup.json' : $name . '.backup';

	$file = dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'backup' . DIRECTORY_SEPARATOR . $filename;

	$json = fetchJSON($src);
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
