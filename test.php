<?php
define('MOD_HASHES', join('|', array(
  "hash1",
  "hash2"
)));

$mods = explode('|', MOD_HASHES);

var_dump($mods);