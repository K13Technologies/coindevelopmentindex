<?php

	include_once('./utils.php');
	include('./json.php');
	include('./github-fetch.php');
	include('./cryptocomp-fetch.php');
	include('./coinmarket-fetch.php');

	switch($_SERVER['REQUEST_METHOD']) {

		case 'POST':

			if(!checkPermissions(JSON_FILE, '0777')) {
				out(errorOutput());
				break;
			}

			if(isset($_POST['delete'])) {
				// make sure index matches owner/name
				$indexed = getRecord(array('index' => $_POST['index']));
				$named = getRecord(array('owner' => $_POST['owner'], 'name' => $_POST['name']));
				if($indexed === $named) {
					out(deleteRecord((int)$_POST['index']));
				} else {
					errorLog('DELETERECORD_ERROR', '<br>Could not find a definitive match for deletion.  You may need to pull and edit the JSON file directly, then push to remote.');
					out(errorOutput());
				}
				break;
			}

			if(isset($_POST['githubfetch'])) {
				// new entry called from repo-edit
				if($_POST['ownername'] === 'new' || $_POST['id'] === '') {
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

			if(isset($_POST['cryptocompfetch'])) {
				$records = fetchCryptoCompData(getRecord($_POST));
				out($records);
				break;
			}

			if(isset($_POST['coinmarketfetch'])) {
				$records = fetchCoinMarketData(getRecord($_POST));
				out($records);
				break;
			}

			if($_POST['ownername'] === 'new') {
				out(addRecords(array(json_decode(json_encode($_POST)))));
			} else {
				out(updateRecords(array(json_decode(json_encode($_POST)))));
			}
			break;

		case 'GET':
		default:
			if(isset($_GET['sort'])) {
				out(sortJSON(fetchJSON(JSON_FILE), $_GET['sort'], isset($_GET['asc']) ? $_GET['asc'] : true));
				break;
			}
			if(isset($_GET['location'])) {
					echo JSON_FILE;
				break;
			}
			if(isset($_GET['pulllocal'])) {
				if(!checkPermissions(LOCAL_FILE, '0777')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				out(write(fetchJSON(REMOTE_FILE),LOCAL_FILE));
				break;
			}
			if(isset($_GET['pushremote'])) {
				out(write(fetchJSON(LOCAL_FILE),REMOTE_FILE));
				break;
			}
			if(isset($_GET['githubfetchall'])) {
				if(isset($_GET['tolocal']) && !checkPermissions(LOCAL_FILE, '0777')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				out(write(fetchGithubData(fetchJSON()), JSON_FILE));
				break;
			}
			out(getRecord(array(
				'owner' => $_GET['owner'],
				'name' => $_GET['name']
			)));
			break;

	}
