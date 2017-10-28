<?php

	include('./json.php');

	switch($_SERVER['REQUEST_METHOD']) {

		case 'POST':

			break;

		case 'GET':
		default:
			getRecord($_GET['id']);
			break;

	}

	function getRecord($id) {

		$json = fetchJSON();

		if(isset($id)) {

		} else {
			out($json);
		}

	}

	function updateRecord($id, $vals) {

		$record = fetchJSON();

	}
