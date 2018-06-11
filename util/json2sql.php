<?php
define('ROOTDIR', __DIR__.'/../');
require ROOTDIR.'config.php';
$tc_db->Execute('SET NAMES utf8');
define('DB', 'over_chans');       // database names

$chans = json_decode(file_get_contents('chans.json'), true);
$chans = $chans['chans'];
$hash = 'f3214d97f41aec84f7bb23eb68def5c2a70f2591e847a1373cb8fabf323c193d';

$fields = array('id', 'passhash', 'name', 'url', 'boards', 'offset', 'catbg', 'userboards', 'prefix', 'postfix', 'wiki', 'radio', 'colors', 'advanced_less', 'default', 'included', 'userboards_catname', 'userboards_system', 'ballv');
foreach($fields as $f) {
  $keys []= '`'.$f.'`';
  $qms []= '?';
}
// var_dump($fields);

$tc_db->Execute('TRUNCATE TABLE `'.DB.'`');

foreach($chans as $chan) {
  echo $chan['id'].'<br>';

  if (! $chan['default'])
    $chan['default'] = 0;
  if (! $chan['included'])
    $chan['included'] = 0;
 
  $chan['boards'] = json_encode($chan['boards']);

  if ($chan['radio'])
    $chan['radio'] = json_encode($chan['radio']);
  
  if ($chan['catbg'])
    $chan['catbg'] = implode('|', $chan['catbg']);

  if ($chan['colors'])
    $chan['colors'] = implode('|', $chan['colors']);

  if ($chan['offset'])
    $chan['offset'] = implode('|', $chan['offset']);

  $chan['passhash'] = $hash;

  if (! $chan['ballv'])
    $chan['ballv'] = "0";
  $chan['ballv'] = (int)$chan['ballv'];

  $values = array();

  foreach ($fields as $f) {
    $values []= $chan[$f];
    echo $f.' = '; var_dump($chan[$f]); echo '<br>';
  }
  $tc_db->Execute('INSERT INTO `'.DB.'` ('.implode(', ', $keys).') VALUES ('.implode(', ', $qms).')', $values);
  var_dump($tc_db->ErrorMsg()); echo '<br><br>';
}