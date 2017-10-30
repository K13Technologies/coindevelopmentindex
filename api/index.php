<?php

	include('./json.php');

	switch($_SERVER['REQUEST_METHOD']) {

		case 'POST':

			break;

		case 'GET':
		default:
			getRecord($_GET['owner'],$_GET['name']);
			break;

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
