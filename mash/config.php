<?php
mb_internal_encoding("UTF-8");
error_reporting(E_ALL ^ E_NOTICE);
if (!headers_sent()) {
  header('Content-Type: text/html; charset=utf-8');
}
define('INSTANT_CONFIG_PATH', '/../config.php');

define('MINIMUM_TIMEGAP', 0.5); 
define('MAX_VOTES', 50); 

define('CHANS_DB', 'over_chans'); // table names
define('CONSTANT_K', 20); 