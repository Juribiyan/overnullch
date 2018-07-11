<?php
mb_internal_encoding("UTF-8");
// Sets error reporting to hide notices.
error_reporting(E_ALL ^ E_NOTICE);
if (!headers_sent()) {
	header('Content-Type: text/html; charset=utf-8');
}

$cf = array();

$cf['KU_ROOTDIR']   = realpath(dirname(__FILE__))."/"; // Full system path of the folder containing kusaba.php, with trailing slash. The default value set here should be OK.. If you need to change it, you should already know what the full path is anyway.

// Database
$cf['KU_DBTYPE']          = 'mysqli';	// Never change this
$cf['KU_DBHOST']          = 'localhost'; // Database hostname. On SQLite this has no effect.
$cf['KU_DBDATABASE']      = 'overnullch'; // Database... database. On SQLite this will be the path to your database file. Secure this file.
$cf['KU_DBUSERNAME']      = 'root'; // Database username. On SQLite this has no effect.
$cf['KU_DBPASSWORD']      = ''; // Database password. On SQLite this has no effect.
$cf['KU_DBUSEPERSISTENT'] = false; // Use persistent connection to database

foreach ($cf as $key => $value) {
	define($key, $value);
}
unset($cf);

// DO NOT MODIFY BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING OR ELSE BAD THINGS MAY HAPPEN
require KU_ROOTDIR . 'lib/adodb/adodb.inc.php';

// SQL  database
if (!isset($tc_db) && !isset($preconfig_db_unnecessary) && !$_GLOBALS['skipdb']) {
	$tc_db = &NewADOConnection(KU_DBTYPE);
	if (KU_DBUSEPERSISTENT) {
		$tc_db->PConnect(KU_DBHOST, KU_DBUSERNAME, KU_DBPASSWORD, KU_DBDATABASE) or die('SQL database connection error: ' . $tc_db->ErrorMsg());
	} else {
		$tc_db->Connect(KU_DBHOST, KU_DBUSERNAME, KU_DBPASSWORD, KU_DBDATABASE) or die('SQL database connection error: ' . $tc_db->ErrorMsg());
	}
  $tc_db->EXECUTE("SET NAMES 'utf8mb4'");
}
?>