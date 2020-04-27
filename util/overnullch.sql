CREATE TABLE IF NOT EXISTS `over_chans` (
  `_id` int(11) NOT NULL AUTO_INCREMENT,
  `id` varchar(20) NOT NULL DEFAULT '',
  `name` varchar(50) NOT NULL DEFAULT '',
  `url` varchar(100) NOT NULL DEFAULT '',
  `default` tinyint(1) NOT NULL DEFAULT '0',
  `included` tinyint(1) NOT NULL DEFAULT '0',
  `offline` tinyint(1) NOT NULL DEFAULT '0',
  `userboards` varchar(100) DEFAULT NULL,
  `userboards_catname` varchar(50) DEFAULT NULL,
  `userboards_system` varchar(20) DEFAULT NULL,
  `boards` text,
  `catbg` varchar(13) NOT NULL DEFAULT 'ffffff|ffffff',
  `wiki` varchar(100) DEFAULT NULL,
  `rating` int(11) NOT NULL DEFAULT '1500',
  `offset` varchar(10) DEFAULT NULL,
  `prefix` varchar(20) DEFAULT NULL,
  `postfix` varchar(20) DEFAULT NULL,
  `radio` text,
  `colors` varchar(13) DEFAULT NULL,
  `advanced_less` text,
  `passhash` char(64) NOT NULL DEFAULT '',
  `ballv` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`_id`),
  UNIQUE KEY `id` (`id`)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `live_links` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(300) NOT NULL DEFAULT '',
  `urlnorm` varchar(300) NOT NULL DEFAULT '',
  `description` varchar(70) NOT NULL DEFAULT '',
  `iphash` char(32) NOT NULL DEFAULT '',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4;
