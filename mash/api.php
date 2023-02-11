<?php
require 'config.php';
require __DIR__.INSTANT_CONFIG_PATH;
$tc_db->SetFetchMode(ADODB_FETCH_ASSOC);

$ret = array();

if($_GET['act'] == 'rates')
  header("Access-Control-Allow-Origin: *");
  $ret['rates'] = get_rates();

session_start();

if($_GET['act'] == 'challenge') {
  $ret['challengers'] = get_challengers();
}

if($_GET['act'] == 'captcha') {
  if(!isset($_SESSION['security_code']))
    retreat('wrong-captcha');
  $correct_captcha = $_SESSION['security_code'];
  unset($_SESSION['security_code']);
  if(!isset($_POST['captcha']) || $correct_captcha != mb_strtoupper($_POST['captcha']) || empty($correct_captcha))
    retreat('wrong_captcha');
  $_SESSION['human'] = true;
  if($_SESSION['total_votes'] >= MAX_VOTES)
    $_SESSION['total_votes'] = 0;
  $continue_vote = true;
}

if(@$continue_vote || $_GET['act'] == 'vote') {
  $now = microtime(true);
  if(isset($_SESSION['last_vote']) && $now - $_SESSION['last_vote'] < MINIMUM_TIMEGAP)
    $_SESSION['human'] = false;

  if(isset($_SESSION['total_votes']) && $_SESSION['total_votes'] >= MAX_VOTES)
    $_SESSION['human'] = false;

  if(!@$_SESSION['human']) {
    $_SESSION['interrupted_vote'] = $_POST['v'];
    retreat('enter_captcha');
  }  

  if(!isset($_SESSION['challengers']))
    retreat('force_reload');

  $v = (@$continue_vote && isset($_SESSION['interrupted_vote'])) ? @$_SESSION['interrupted_vote'] : @$_POST['v'];

  unset($_SESSION['interrupted_vote']);

  if($v == 'left') {
    $winner = $_SESSION['challengers'][0]['_id'];
    $loser =  $_SESSION['challengers'][1]['_id'];
  }
  elseif($v == 'right') {
    $winner = $_SESSION['challengers'][1]['_id'];
    $loser =  $_SESSION['challengers'][0]['_id'];
  }
  else
    retreat('wrong_request');

  $pair_ratings = $tc_db->GetAll('SELECT `rating` FROM `'.CHANS_DB.'` WHERE `_id` IN ("'.$winner.'", "'.$loser.'") ORDER BY FIELD (`_id`, "'.$winner.'", "'.$loser.'")');

  if(count($pair_ratings) < 2) {
    unset($_SESSION['challengers']);
    retreat('force_reload');
  }

  $winner_rating = (int)$pair_ratings[0]['rating'];
  $loser_rating = (int)$pair_ratings[1]['rating'];

  $winner_new_rating = round(win($winner_rating, expected($loser_rating, $winner_rating)));
  $loser_new_rating = round(loss($loser_rating, expected($winner_rating, $loser_rating)));

  $tc_db->Execute("UPDATE `".CHANS_DB."` 
    SET `rating` = CASE `_id`
      WHEN ".$loser." THEN ".$loser_new_rating.
      " WHEN ".$winner." THEN ".$winner_new_rating.
    " END 
  WHERE `_id` IN(".$loser.",".$winner.")");

  $_SESSION['prev'] = $_SESSION['challengers'];
  unset($_SESSION['challengers']);

  $_SESSION['last_vote'] = $now;
  $_SESSION['total_votes']++;

  $ret['rates'] = get_rates();
  $ret['challengers'] = get_challengers();
  $ret['vote_success'] = true;
}

if(!empty($ret))
  advance($ret);

function get_rates() {
  global $tc_db;
  $rates = $tc_db->GetAll('SELECT `id`, `rating` FROM `'.CHANS_DB.'` WHERE `offline`=0');
  return $rates;
}

function get_challengers() {
  global $tc_db;
  //if not voted since last time
  if(isset($_SESSION['challengers']))
    return $_SESSION['challengers'];
  else {
    //make sure not to send previous challengers
    $cond = " WHERE `offline`='0'";
    if(isset($_SESSION['prev'])) 
      $cond .= " AND `_id` != ".$_SESSION['prev'][0]['_id']." AND `_id` != ".$_SESSION['prev'][1]['_id'];
    $pair = $tc_db->GetAll("SELECT `id`, `_id` FROM `".CHANS_DB."`".$cond." ORDER BY RAND() LIMIT 2");
    $_SESSION['challengers'] = $pair;
  }
  return $pair;
}

// матожидание
function expected($Rb, $Ra) {
 return 1/(1 + pow(10, ($Rb-$Ra)/400));
}
// Calculate the new winnner score
function win($score, $expected, $k = CONSTANT_K) {
 return $score + $k * (1-$expected);
}
// Calculate the new loser score
function loss($score, $expected, $k = CONSTANT_K) {
 return $score + $k * (0-$expected);
}

function retreat($errmsg) {
  exit(json_encode(array(
    "error" => $errmsg
  )));
}

function advance($data) {
  exit(json_encode(array(
    "error" => false,
    "data" => $data
  )));
}

function debug($data) {
  exit(json_encode(array(
    "debug" => $data
  )));
}