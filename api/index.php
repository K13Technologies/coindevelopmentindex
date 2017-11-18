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
				if($_POST['ownername'] === 'new') {
					$records = fetchGithubData([(object)
						['owner' => $_POST['owner'],
							'name' => $_POST['name'] ]
					]);
				}
				if($_POST['id'] !== '') {
					$records = fetchGithubData(getRecord(array('id' => $_POST['id'])));
				}
				out($records);
				break;
			}

			if($_POST['ownername'] === 'new') {
				out(addRecords(array($_POST)));
			} else {
				// $records = array(getRecord(array('id' => $_POST['id'])));
				out(updateRecords(array($_POST)));
			}
			break;

		case 'GET':
		default:
			if(isset($_GET['sort'])) {
				sortJSON($_GET['sort'], isset($_GET['asc']) ? $_GET['asc'] : true);
				break;
			}
			out(getRecord(array(
				'owner' => $_GET['owner'],
				'name' => $_GET['name']
			)));
			break;

	}

