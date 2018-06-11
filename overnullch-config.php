<?php
define('SALT', ''); // Enter some random characters
define('MASTER_HASH', ''); // Get your master hash: /overnullch-config.php?getpasswordhash=<your password>
define('MOD_HASHES', join('|', array(
  "hash1",
  "hash2"
))); // Enter hashes for mods, obtained the same way as master hash

if ($_GET['getpasswordhash']) {
  echo hash('sha256', $_GET['getpasswordhash'].SALT);
}