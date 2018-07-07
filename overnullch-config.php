<?php
define('SALT', ''); // Enter some random characters

define('ADMIN_HASHES', join('|', array( // To get hash go to /overnullch-config.php?getpasswordhash=<your password>
  "admin1",
  "admin2"
))); 

define('MOD_HASHES', join('|', array( // Enter hashes for mods, obtained the same way as admin hashes
  "mod1",
  "mod2"
)));

if ($_GET['getpasswordhash']) {
  echo hash('sha256', $_GET['getpasswordhash'].SALT);
}