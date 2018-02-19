<?php

	include_once('utils.php');
	include('json.php');
	include('github-fetch.php');
	include('cryptocomp-fetch.php');
	include('coinmarket-fetch.php');

	// if not an HTTP request just spit out json and die...
	if(!isset($_SERVER['REQUEST_METHOD'])) {
			out(getRecord(array()));
			die;
	}

	switch($_SERVER['REQUEST_METHOD']) {

		case 'POST':

			if(!checkPermissions(JSON_FILE, '0664')) {
				out(errorOutput());
				break;
			}

			if(isset($_POST['delete'])) {
				// make sure index matches owner/name
				$indexed = getRecord(array('index' => intval($_POST['index'])));
				$named = getRecord(array('coinname' => $_POST['coinname'], 'symbol' => $_POST['symbol']));
				if($indexed === $named) {
					out(deleteRecord(intval($_POST['index'])));
				} else {
					errorLog('DELETERECORD_ERROR', '<br>Could not find a definitive match for deletion.  You may need to pull and edit the JSON file directly, then push to remote.');
					out(errorOutput());
				}
				break;
			}

			if(isset($_POST['githubfetch'])) {
				// new entry called from repo-edit
				if(isset($_POST['new'])) {
					$records = fetchGithubData([(object)
						['owner' => $_POST['owner'],
							'name' => $_POST['name'] ]
					]);
				}
				if($_POST['owner'] !== '' && $_POST['name'] !== '') {
					$records = fetchGithubData(getRecord(array('owner' => $_POST['owner'],
																											'name' => $_POST['name'])));
				}
				out($records);
				break;
			}

			if(isset($_POST['cryptocompfetch'])) {
				if($_POST['cryptocompfetch'] === 'data') {
					$records = fetchCryptoCompData(getRecord($_POST));
				}
				if($_POST['cryptocompfetch'] === 'price') {
					$records = fetchCryptoCompPrice(getRecord($_POST));
				}
				out($records);
				break;
			}

			if(isset($_POST['coinmarketfetch'])) {
				$records = fetchCoinMarketData(getRecord($_POST));
				out($records);
				break;
			}

			if(isset($_POST['csvupdate'])) {
				$records = array(getCSVrecord($_POST['symbol'], fetchCSV()));
				out($records);
				break;
			}

			if(isset($_POST['new'])) {
				out(addRecords(array(json_decode(json_encode($_POST)))));
			} else {
				out(updateRecords(array(json_decode(json_encode($_POST)))));
			}
			break;

		case 'GET':
		default:

			if(isset($_GET['fields'])) {
				out(fetchJSON(FIELDS_FILE));
				break;
			}
			if(isset($_GET['sort'])) {
				out(sortJSON(fetchJSON(JSON_FILE), $_GET['sort'], isset($_GET['asc']) ? $_GET['asc'] : true));
				break;
			}
			if(isset($_GET['location'])) {
					if(JSON_FILE === LOCAL_FILE) echo $_SERVER['HTTP_HOST'] . str_replace($_SERVER['DOCUMENT_ROOT'], '', JSON_FILE);
					else echo JSON_FILE;
				break;
			}
			if(isset($_GET['filemtime'])) {
				echo date('M d, Y H:i:s T', filemtime(JSON_FILE));
				break;
			}
			if(isset($_GET['pulllocal'])) {
				if(!checkPermissions(LOCAL_FILE, '0664')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				out(write(fetchJSON(REMOTE_FILE),LOCAL_FILE, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
				break;
			}
			if(isset($_GET['pushremote'])) {
				$file = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR . 'backup'  . DIRECTORY_SEPARATOR . $_GET['pushremote'];
				out(write(fetchJSON($file), REMOTE_FILE));
				break;
			}
			if(isset($_GET['restore'])) {
				$file = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR . 'assets/json/backup'  . DIRECTORY_SEPARATOR . $_GET['restore'];
				out(write(fetchJSON($file), LOCAL_FILE));
				break;
			}
			if(isset($_GET['githubfetchall'])) {
				if(isset($_GET['local']) && !checkPermissions(LOCAL_FILE, '0664')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				out(write(fetchGithubData(fetchJSON(), true), isset($_GET['local']) ? LOCAL_FILE : JSON_FILE));
				break;
			}
			if(isset($_GET['coinmarketfetchall'])) {
				if(isset($_GET['local']) && !checkPermissions(LOCAL_FILE, '0664')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				out(write(fetchCoinMarketData(fetchJSON()), isset($_GET['local']) ? LOCAL_FILE : JSON_FILE));
				break;
			}
			if(isset($_GET['cryptocompfetchall'])) {
				if(isset($_GET['local']) && !checkPermissions(LOCAL_FILE, '0664')) {
					array_map(function($err){echo $err->type . $err->message;}, errorOutput()->errors);
					break;
				}
				if($_GET['cryptocompfetchall'] === 'data') {
					out(write(fetchCryptoCompData(fetchJSON()), isset($_GET['local']) ? LOCAL_FILE : JSON_FILE));
				}
				if($_GET['cryptocompfetchall'] === 'price') {
					out(write(fetchCryptoCompPrice(fetchJSON()), isset($_GET['local']) ? LOCAL_FILE : JSON_FILE));
				}
				break;
			}
			if(isset($_GET['archive'])) {
				if(!checkPermissions(ARCHIVE_FILE, '0777')) {
					array_map(function($err){echo $err->type . $err->message . PHP_EOL;}, errorOutput()->errors);
					break;
				}
				out(write(archive()->archive, ARCHIVE_FILE));
				break;
			}
			if(isset($_GET['logs'])) {
				print('<pre>' . logView() . '</pre>');
				break;
			}
			if(isset($_GET['backup'])) {
				if(!checkPermissions(dirname(LOCAL_FILE) . DIRECTORY_SEPARATOR . 'backup', '0664')) {
					array_map(function($err){echo $err->type . $err->message . PHP_EOL;}, errorOutput()->errors);
					break;
				}
				out(backup());
				break;
			}
			if(isset($_GET['local'])) {
				out(fetchJSON(LOCAL_FILE));
				break;
			}

			$find = array();

			if(isset($_GET['coinname'])) array_push($find, $_GET['coinname']);
			if(isset($_GET['symbol'])) array_push($find, $_GET['symbol']);

			out(getRecord($find));
			break;

	}
