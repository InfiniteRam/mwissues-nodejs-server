
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";


-- Version 1.1
-- Don't forget to change mwver value when the structure changes


CREATE TABLE `mwver` (
  `version` varchar(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `mwissues`.`mwver` (`version`) VALUES ('1.1');


CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `login` varchar(64) NOT NULL,
  `password` binary(128) NOT NULL,
  `salt` binary(16) NOT NULL,
  `permissions` varchar(32) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_UNIQUE` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `apikeys` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `key` char(32) NOT NULL,
  `keyname` varchar(64) DEFAULT NULL,
  `userid` int(10) unsigned NOT NULL,
  `permissions` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idapikeys_UNIQUE` (`key`),
  KEY `apikey_userid_idx` (`userid`),
  CONSTRAINT `apikey_userid` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `issues` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(256) NOT NULL,
  `description` text,
  `scene` varchar(256) NOT NULL,
  `state` int(11) NOT NULL,
  `category` int(11) NOT NULL,
  `position` varchar(64) NOT NULL,
  `cameraPosition` varchar(64) NOT NULL,
  `cameraOrientation` varchar(64) NOT NULL,
  `orthographicSize` float DEFAULT NULL,
  `reporter` int(10) unsigned NOT NULL,
  `reporterkey` int(10) unsigned DEFAULT NULL,
  `assignee` int(10) unsigned DEFAULT NULL,
  `screenshot` varchar(64) DEFAULT NULL,
  `customData` text,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archived` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `archived` (`archived`),
  KEY `issues_reporterid_idx` (`reporter`),
  KEY `issues_assigneeid_idx` (`assignee`),
  KEY `issues_reporterkeyid_idx` (`reporterkey`),
  CONSTRAINT `issues_assigneeid` FOREIGN KEY (`assignee`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `issues_reporterid` FOREIGN KEY (`reporter`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `issues_reporterkeyid` FOREIGN KEY (`reporterkey`) REFERENCES `apikeys` (`userid`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
