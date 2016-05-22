
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--

CREATE TABLE `issues` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` text,
  `scene` varchar(256) NOT NULL,
  `state` int(11) NOT NULL,
  `category` int(11) NOT NULL,
  `position` varchar(48) NOT NULL,
  `cameraPosition` varchar(48) NOT NULL,
  `cameraOrientation` varchar(48) NOT NULL,
  `orthographicSize` float DEFAULT NULL,
  `reporter` varchar(64) NOT NULL,
  `assignee` varchar(64) DEFAULT NULL,
  `screenshot` varchar(64) DEFAULT NULL,
  `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archived` boolean NOT NULL DEFAULT FALSE
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--

ALTER TABLE `issues`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `issues`
  ADD INDEX (`archived`);

--

ALTER TABLE `issues`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
