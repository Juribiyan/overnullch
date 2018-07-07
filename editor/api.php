<?php
mb_internal_encoding("UTF-8");
error_reporting(E_ALL ^ E_NOTICE);
if (!headers_sent()) {
  header('Content-Type: text/html; charset=utf-8');
}
define('ROOTDIR', __DIR__.'/../');
define('KOLCHOQUE', 'https://1chan.ca');
require ROOTDIR.'config.php';
require ROOTDIR.'overnullch-config.php';
$tc_db->SetFetchMode(ADODB_FETCH_ASSOC);
$tc_db->Execute('SET NAMES utf8');
define('DB', 'over_chans');       // database names

//field pre-check
if (isset($_GET['checkuniq'])) {
  if (isset($_GET['prop']) && isset($_GET['val']) && in_array($_GET['prop'], array('name', 'id', 'url'))) {
    $found = check_uniqueness($_GET['prop'], $_GET['val']);
    if ($found)
      retreat();
    else
      advance();
  }
  else retreat('Wrong data provided for checkuniq');
}

$mods = explode('|', MOD_HASHES);
$admins = explode('|', ADMIN_HASHES);

if (in_array($_GET['forceupdate'], $admins)) {
  update_json();
}

//main
if (isset($_POST['action']) && in_array($_POST['action'], array('new', 'delete', 'edit'))) {
  session_start();

  $captcha = $_SESSION['security_code'];
  unset($_SESSION['security_code']);
  if(!isset($_POST['captcha']) || $captcha != mb_strtoupper($_POST['captcha']) || empty($captcha))
    retreat(array('wrong-captcha'));

  $hash = hash('sha256', $_POST['password'].SALT);
  if (in_array($hash, $admins)) {
    $is_admin = true;
    $is_mod = true;
  }
  if (in_array($hash, $mods)) {
    $is_mod = true;
  }

  $pre = $tc_db->GetAll('SELECT COUNT(1), `default`, `passhash` FROM `'.DB.'` WHERE `id`=?', array($_POST['id']));
  if ($pre) {
    $pre = $pre[0];
  }
  else {
    retreat('db-error');
  }

  $chan_exists = $pre['COUNT(1)'];
  $default = $pre['default'];
  $truehash = $pre['passhash'];

  if ($_POST['action'] == 'new') {
    if ($chan_exists)
      retreat(array(field => 'id', msg => 'occupied'));
  }
  else {
    if (! $chan_exists)
      retreat('chan-does-not-exist');
    if ($hash !== $truehash && (($_POST['action'] == 'delete' && !$is_admin) || ($_POST['action'] == 'edit' && !$is_mod))) {
      retreat('wrong-password');
    }
  }

  $valid = check_validity($_POST, $_FILES);
  if ($valid['errors'])
    retreat($valid['errors']);
  
  $input = $valid['data'];

  $input['passhash'] = $hash;

  if (isset($input['default'])) {
    $input['section'] = $input['default'] ? 'default' : 'custom';
    if ($_POST['action'] == 'edit' && $input['default'] != $default) {
      $input['prev_section'] = $default ? 'default' : 'custom';
    }
  }
  else {
    $input['section'] = $default ? 'default' : 'custom';
  }
  
  $integrity_errors = check_integrity($input, $_POST['action']);
  if ($integrity_errors)
    retreat($integrity_errors);

  check_uniqueness_forall($input, $_POST['action']);

  $db_result = call_user_func($_POST['action'].'_chan', $input);
  if ($db_result) {
    $res = array(action => $_POST['action'].'-success');
    update_json();
    if ($input['prev_section']) {
      $res['moveto'] = $input['section'];
    }
    /*if ($_POST['action'] == 'new') {
      post_live_link('http://0chan.one?catalog/'.$input['section'], '😶 '.$input['name'].' добавлен в каталог ← Овернульч');
    }*/
    advance($res);
  }
  else {
    var_dump($tc_db->sql);
    retreat('db-error');
  }
}

//validation stages
function check_validity($input, $f) {
  global $is_admin, $is_mod;

  if (isset($input['id'])) {
    $output['id'] = trim($input['id']);
    if (strlen($output['id']) > 20)
      $errs []= array(field => "id", msg => 'too-long');
    if (strlen($output['id']) < 3)
      $errs []= array(field => "id", msg => 'too-short');
  }
  if (isset($input['name'])) {
    $output['name'] = trim($input['name']);
    if (strlen($output['name']) > 50)
      $errs []= array(field => "name", msg => 'too-long');
    if (strlen($output['name']) < 3)
      $errs []= array(field => "name", msg => 'too-short');
  }
  $urly = array('url', 'userboards');
  foreach($urly as &$up) {
    if (isset($input[$up])) {
      $output[$up] = trim($input[$up]);
      if (preg_match("/https?:\\/\\//", $output[$up]) === false)
        $errs []= array(field => $up, msg => 'invalid');
      if (strlen($output['url']) > 100)
        $errs []= array(field => $up, msg => 'too-long');
    }
  }
  $pairy = array('catbg', 'colors', 'offset');
  foreach($pairy as &$pp) {
    if (isset($input[$pp])) {
      $output[$pp] = json_decode($input[$pp]);
      if ($pp == 'colors' && $output[$pp] == null)
        break;
      if (!is_array($output[$pp]) || count($output[$pp]) != 2)
        $errs []= array(field => $pp, msg => 'invalid');
      else {
        if ($pp != 'offset') {
          $ok = true;
          foreach($output[$pp] as $ipp) {
            if (preg_match("/^[0-9a-z]{6}$/i", $ipp) === false)
              $ok = false;
          }
          if (!$ok)
            $errs []= array(field => $pp, msg => 'invalid');
        }
        else {
          $ok = true;
          foreach($output[$pp] as $ipp) {
            $val = intval($ipp);
            if ($val > 100 || $val < -100)
              $ok = false;
          }
          if (!$ok || strlen(implode('|', $output[$pp])) > 10)
            $errs []= array(field => $pp, msg => 'invalid');
        }
        $output[$pp] = implode('|', $output[$pp]);
      }
    }
  }
  $jsony = array('boards', 'radio');
  foreach($jsony as &$jp) {
    if (isset($input[$jp])) {
      if (strtolower($input[$jp]) !== 'null') {
        $json = json_decode($input[$jp]);
        if ($json === null)
          $errs []= array(field => $jp, msg => 'invalid');
        else
          $output[$jp] = $input[$jp];
      }
      else
        $output[$jp] = $json;
    }
  }
  if (isset($input['wiki'])) {
    if (strlen($input['wiki']) > 100)
      $errs []= array(field => "wiki", msg => 'too-long');
    if (strlen($input['wiki'])!=0 && strlen($input['wiki']) < 4)
      $errs []= array(field => "wiki", msg => 'too-short');
    $output['wiki'] = $input['wiki'];
  }

  if (isset($input['userboards'])) {
    if (isset($input['userboards_system'])) {
      if (!in_array($input['userboards_system'], array('instant', '0chan')))
        $errs []= array(field => "userboards_system", msg => 'invalid');
      $output['userboards_system'] = $input['userboards_system'];
    }
    else {
      $input['userboards_system'] = 'instant';
    }
  }

  if (isset($input['userboards_catname'])) {
    if (strlen($input['userboards_catname']) > 50)
      $errs []= array(field => "userboards_catname", msg => 'too-long');
    $output['userboards_catname'] = $input['userboards_catname'];
  }

  $opty = array('prefix', 'postfix');
  foreach($opty as &$xp) {
    if (isset($input[$xp])) {
      if (strlen($input[$xp]) > 20)
        $errs []= array(field => $xp, msg => 'too-long');
      $output[$xp] = $input[$xp];
    }
  }
  if (isset($f['ball'])) {
    $ball = $f['ball'];
    if ($ball['size'] > 100000)
      $errs []= array(field => 'ball', msg => 'file-too-big');
    list($width, $height, $type) = getimagesize($ball['tmp_name']);
    if ($type != IMAGETYPE_PNG)
      $errs []= array(field => 'ball', msg => 'image-not-png');
    if ($width > 200 || $hight > 200)
      $errs []= array(field => 'ball', msg => 'image-too-large');
    $output['ball'] = $ball;
  }
  if (isset($input['advanced_less'])) {
    $output['advanced_less'] = $input['advanced_less'];
  }
  if (isset($input['password'])) {
    $output['password'] = $input['password'];
  }
  $admy = array('default', 'included');
  foreach($admy as &$ap) {
    if (isset($input[$ap])) {
      if (!$is_admin) {
        $errs []= array(field => 'admy', msg => 'not-admin');
      }
      if (!in_array($input[$ap], array(0, 1))) {
        $errs []= array(field => 'admy', msg => 'wrong-value');
      }
      $output[$ap] = $input[$ap];
    }
  }
  return array(
    data => $output,
    errors => $errs
  );
}
function check_integrity($input, $act) {
  $absolutely_required = array('id', 'password');
  foreach($absolutely_required as &$arf) {
    if (!isset($input[$arf]))
      $errs []= array(field => $arf, msg => 'missing');
  }
  $required = array('name', 'url', 'boards', 'ball', 'offset', 'catbg');
  $optional = array('userboards', 'prefix', 'postfix', 'wiki', 'radio', 'colors', 'advanced_less', 'default', 'included', 'userboards_catname', 'userboards_system');
  $all = array_merge_recursive($required, $optional);
  if ($act == 'add') {
    foreach ($required as &$rf) {
      if (!isset($input[$rf]))
        $errs []= array(field => $rf, msg => 'missing');
    }
  }
  if ($act == 'edit') {
    $fields_to_edit = 0;
    foreach ($all as &$f) {
      if (array_key_exists($f, $input))
        $fields_to_edit++;
    }
    if (!$fields_to_edit) {
      $errs []= array('nothing-to-edit');
    }
  }
  return $errs;
}
function check_uniqueness($key, $value) {
  global $tc_db;
  return intval($tc_db->GetOne("SELECT COUNT(1) FROM `".DB."` WHERE `".$key."` = ?", array($value)));
}
function check_uniqueness_forall($input, $act) {
  $fields = array('name', 'url');
  foreach ($fields as &$f) {
    if (check_uniqueness($f, $input[$f]))
      $errs []= array(field => $f, msg => 'occupied');
  }
  if ($errs)
    retreat($errs);
}

//basic actions
function new_chan($input) {
  global $tc_db;
  // exit($input['userboards_system']);
  $fields = array('id', 'passhash', 'name', 'url', 'boards', 'offset', 'catbg', 'userboards', 'prefix', 'postfix', 'wiki', 'radio', 'colors', 'advanced_less', 'default', 'included', 'userboards_catname', 'userboards_system');
  foreach($fields as &$f) {
    if (array_key_exists($f, $input)) {
      $keys []= '`'.$f.'`';
      $values []= $input[$f];
      $qms []= '?';
    }
  }
  $filename = ROOTDIR.'chans/balls/'.$input['section'].'/'.$input['id'].'.png';
  save_file($input);
  return $tc_db->Execute('INSERT INTO `'.DB.'` ('.implode(', ', $keys).') VALUES ('.implode(', ', $qms).')', $values);
}
function edit_chan($input) {
  global $tc_db;
  $has_ball = false;
  $fields = array('name', 'url', 'boards', 'offset', 'catbg', 'userboards', 'prefix', 'postfix', 'wiki', 'radio', 'colors', 'advanced_less', 'default', 'included', 'ball', 'userboards_catname', 'userboards_system');
  foreach($fields as &$f) {
    if (array_key_exists($f, $input)) {
      if ($f == 'ball') {
        $keys []= '`ballv`=ballv+1';
        $has_ball = true;
      }
      else {
        $keys []= '`'.$f.'`=?';
        $values []= $input[$f];
      }
    }
  }
  if ($input['prev_section']) {
    if ($has_ball) {
      unlink(ROOTDIR.'chans/balls/'.$input['prev_section'].'/'.$input['id'].'.png');
    }
    else {
      rename(ROOTDIR.'chans/balls/'.$input['prev_section'].'/'.$input['id'].'.png', ROOTDIR.'chans/balls/'.$input['section'].'/'.$input['id'].'.png');
    }
  }
  if ($has_ball) {
    save_file($input);
  }
  $values []= $input['id'];

  return $tc_db->Execute('UPDATE `'.DB.'` SET '.implode(', ', $keys).' WHERE `id`=?', $values);
}
function delete_chan($input) {
  global $tc_db;
  unlink(ROOTDIR.'chans/balls/'.$input['section'].'/'.$input['id'].'.png');
  return $tc_db->Execute('DELETE FROM `'.DB.'` WHERE `id`=?', array($input['id']));
}

function save_file($input) {
  global $tc_db;
  if ($input['ball']['error'] == UPLOAD_ERR_OK) {
    $filename = ROOTDIR.'chans/balls/'.$input['section'].'/'.$input['id'].'.png';
    if (file_exists($filename)) {
      unlink($filename);
    }
    $upload_succ = move_uploaded_file($input['ball']['tmp_name'], $filename);
    if (!$upload_succ) {
      retreat(array(field => 'ball', msg => 'upload-error'));
    }
  }
  else {
    retreat(array(field => 'ball', msg => 'upload-error'));
  }
}


function update_json() {
  global $tc_db;
  $json_filename = ROOTDIR.'chans/chans.json';
  $chans = $tc_db->GetAll("SELECT `_id`, `id`, `default`, `name`, `url`, `included`, `boards`, `userboards`, `catbg`, `wiki`, `offset`, `prefix`, `postfix`, `radio`, `colors`, `advanced_less`, `ballv`, `userboards_catname`, `userboards_system` FROM `".DB."` ORDER BY `_id` ASC");
  $optional_props = array('_id', 'userboards', 'wiki', 'offset', 'prefix', 'postfix', 'radio', 'colors', 'advanced_less', 'userboards_catname', 'userboards_system', `ballv`);
  $paired_props = array('colors', 'catbg', 'offset');
  $json_props = array('boards', 'radio');
  $privilege_props = array('included', 'default');
  foreach ($chans as &$chan) {
    foreach ($privilege_props as &$sp) {
      if ($chan[$sp] == '1') {
        $chan[$sp] = 1;
      }
      else {
        unset($chan[$sp]);
      }
    }
    foreach ($optional_props as &$op) {
      if ($chan[$op] == null)
        unset($chan[$op]);
    }
    if ($chan['ballv'] == 0)
      unset($chan['ballv']);
    foreach ($paired_props as &$pp) {
      if ($chan[$pp]) {
        $chan[$pp] = explode('|', $chan[$pp]);
        if ($pp == 'offset')
          foreach ($chan[$pp] as &$cpp)
            $cpp = intval($cpp);
      }
    }
    foreach ($json_props as &$jp) {
      if ($chan[$jp])
        $chan[$jp] = json_decode($chan[$jp]);
    }
  }
  $res = array(
    version => time(),
    chans => $chans
  );
  $json = fopen($json_filename, 'w');
  fwrite($json, json_encode($res));
  fclose($json);
}

function post_live_link($link, $description) {
  $q = http_build_query(array(
    'link' => $link,
    'description' => $description
  ));
  $ch = curl_init();

  curl_setopt($ch, CURLOPT_URL, KOLCHOQUE."/live/add/");
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $q);

  // receive server response ...
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  // UNCOMMENT DIS!
  $server_output = curl_exec($ch);

  curl_close($ch);
}

//API
function retreat($errmsg='error') {
  exit(json_encode(array(
    error => $errmsg
  )));
}
function advance($data=array()) {
  $data['error'] = false;
  exit(json_encode($data));
}