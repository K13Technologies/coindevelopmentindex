<?php

	include_once('./utils.php');
	include('./json.php');
	include('./github-fetch.php');

	switch($_SERVER['REQUEST_METHOD']) {

		case 'POST':

			if(!checkPermissions(JSON_FILE, '0777')) {
				out(errorOutput());
				break;
			}

			if(isset($_POST['githubfetch'])) {
				// new entry called from repo-edit
				if($_POST['owner'] && $_POST['name'] && $_POST['id'] === '') {
					array_push($json, (object) [
							'owner' => $_POST['owner'],
							'name' => $_POST['name']
					]);
				}
				if($_POST['id'] !== '') {
					$records = fetchGithubData(getRecord(array('id' => $_POST['id'])));
				}
				out($records);
				break;
			}

			$records = array(getRecord(array('id' => $_POST['id'])));
			out(updateRecords($records));

			break;

		case 'GET':
		default:
			out(getRecord(array(
				'owner' => $_GET['owner'],
				'name' => $_GET['name']
			)));
			break;

	}

