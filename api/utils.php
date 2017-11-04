<?php

function checkPermissions($file, $mod) {

	// check file permissions for updating file
	$perms = substr(sprintf('%o', fileperms($file)), -4);

	if($perms !== $mod) {
		echo '<div style="font-family:sans-serif;line-height:1.5;">';
		echo '<b style="display:block;background-color:red;padding:10px;">ERROR: Incorrect permissions on ' . $file;
		echo '&nbsp;&nbsp;Permissions are: ' . $perms . ', but should be ' . $mod . ' </b>';
		echo '<br>To fix, enter the the following command in Terminal:<br>';
		echo '<pre>sudo chmod ' . $mod . ' ' . $file . '</pre>';
		echo '</div>';
		die;
	}
}
