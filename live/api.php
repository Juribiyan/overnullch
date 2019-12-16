<?php
require __DIR__.'/../config.php';
mb_internal_encoding("UTF-8");
$tc_db->SetFetchMode(ADODB_FETCH_ASSOC);
$tc_db->Execute('SET NAMES utf8');
define('MAXLINKS', 50);
define('MAXURLLENGTH', 300);
define('MAXDESCLENGTH', 70);
define('MINDESCLENGTH', 3);
define('SALT', 'WEJFOWEIfjfwoiejWFEJ2398oew');
define('TIMEOUT', 5*60); // timeout in seconds
define('JSONFILE', 'live.json');

header('Access-Control-Allow-Origin: *');

if (!$_POST['url'] || !$_POST['description']) {
  retreat('no-data-provided');
}
$url = super_trim($_POST['url']);
$desc = super_trim($_POST['description']);
if (mb_strlen($url) > MAXURLLENGTH) {
  retreat('url-too-long');
}
if (mb_strlen($desc) > MAXDESCLENGTH) {
  retreat('description-too-long');
}
if (mb_strlen($desc) < MINDESCLENGTH) {
  retreat('description-too-short');
}
if (! preg_match("/^https?:\/\/(?:www\.)?((?:(?!www\.)[^\/\?#\.\s]+?\.)[^\/\?#\s]{2,})(\/[^\?#]+?)?\/?(?:(\?.+?))?(?:(#.+?))?$/i", $url, $url_parsed)) {
  retreat('bad-url');
}
$url_norm = strtolower($url_parsed[1].$url_parsed[2].$url_parsed[3].$url_parsed[4]);
$same_url_exists = $tc_db->GetOne('SELECT COUNT(1) FROM `live_links` WHERE `urlnorm`=?', array($url_norm));
if ($same_url_exists) {
  retreat('url-exists');
}
$iphash = md5($_SERVER['REMOTE_ADDR'].SALT);
$time_passed = $tc_db->GetOne('SELECT (NOW()-`timestamp`) `time_passed` FROM `live_links` WHERE `iphash`=? ORDER BY `timestamp` DESC LIMIT 1', array($iphash));
if ($time_passed && $time_passed < TIMEOUT) {
  retreat(array(errtype => 'timeout', errdata => TIMEOUT-$time_passed));
}
$insert_result = $tc_db->Execute('INSERT INTO `live_links` (`url`, `urlnorm`, `description`, `iphash`) VALUES (?, ?, ?, ?)', array($url, $url_norm, $desc, $iphash));
if(!$insert_result || $tc_db->Affected_Rows() < 1) {
  retreat('sql-error');
}
$list = $tc_db->GetAll('SELECT `url`, `description` FROM `live_links` ORDER BY `timestamp` DESC');
$json_file = fopen(JSONFILE, 'w');
fwrite($json_file, json_encode($list));
fclose($json_file);
$tc_db->Execute('DELETE FROM `live_links` WHERE `id` NOT IN (SELECT `id` FROM (SELECT `id` FROM `live_links` ORDER BY `timestamp` DESC LIMIT ?) `latest`)', array(MAXLINKS));
advance($list);

function super_trim($str) {
  return trim(preg_replace('/\s{2,}|\r\n|\r|\n/i', ' ', $str));
}

function retreat($errmsg) {
  exit(json_encode(array(
    error => $errmsg
  )));
}
function advance($data) {
  exit(json_encode(array(
    error => false,
    data => $data
  )));
}
