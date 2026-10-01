-- phpMyAdmin SQL Dump
-- Database: `ecomdb`

CREATE DATABASE IF NOT EXISTS `ecomdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `ecomdb`;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` text NOT NULL,
  `password` varchar(255) NOT NULL,
  `stauts` text DEFAULT 'active',
  `role` text DEFAULT 'admin',
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `username`, `password`, `stauts`, `role`, `created`) VALUES
(1, 'admin@theirnibs.com', 'password123', 'active', 'admin', NOW()),
(2, 'admin', 'admin123', 'active', 'admin', NOW())
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- --------------------------------------------------------
-- Table structure for table `website_menus` (Dynamic Navigation)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `website_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL DEFAULT '/',
  `parent_id` int(11) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'active',
  `badge` varchar(50) DEFAULT NULL,
  `target` varchar(20) DEFAULT '_self',
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sample Seed Data for Website Menus and Submenus
INSERT INTO `website_menus` (`id`, `title`, `url`, `parent_id`, `order_index`, `status`, `badge`) VALUES
-- Top Level Main Menus
(1, 'Sophie Ellis-Bextor Collaboration', '/collections/sophie', NULL, 1, 'active', 'COLLAB'),
(2, 'New In', '/collections/new-in', NULL, 2, 'active', 'NEW'),
(3, 'Womens', '/collections/womens', NULL, 3, 'active', NULL),
(4, 'Mens', '/collections/mens', NULL, 4, 'active', NULL),
(5, 'Kids', '/collections/kids', NULL, 5, 'active', NULL),
(6, 'Accessories', '/collections/accessories', NULL, 6, 'active', NULL),
(7, 'Gifting', '/collections', NULL, 7, 'active', 'GIFT'),

-- Submenus for 'New In' (parent_id = 2)
(8, 'Latest Pyjama Sets', '/collections/new-in?cat=sets', 2, 1, 'active', NULL),
(9, 'New Nightdresses', '/collections/new-in?cat=dresses', 2, 2, 'active', NULL),
(10, 'Autumn Prints', '/collections/new-in?cat=autumn', 2, 3, 'active', NULL),

-- Submenus for 'Womens' (parent_id = 3)
(11, 'Long Pyjama Sets', '/collections/womens?type=long', 3, 1, 'active', NULL),
(12, 'Short Pyjama Sets', '/collections/womens?type=short', 3, 2, 'active', NULL),
(13, 'Satin & Gauze Pyjamas', '/collections/womens?type=satin', 3, 3, 'active', 'HOT'),
(14, 'Dressing Gowns & Robes', '/collections/womens?type=robes', 3, 4, 'active', NULL),

-- Submenus for 'Mens' (parent_id = 4)
(15, 'Traditional Mens Pyjamas', '/collections/mens?type=traditional', 4, 1, 'active', NULL),
(16, 'Charcoal Mushroom Sets', '/collections/mens?type=mushroom', 4, 2, 'active', NULL),
(17, 'Loungewear Bottoms', '/collections/mens?type=bottoms', 4, 3, 'active', NULL),

-- Submenus for 'Kids' (parent_id = 5)
(18, 'Girls Nightwear', '/collections/kids?gender=girls', 5, 1, 'active', NULL),
(19, 'Matching Family Sets', '/collections/kids?type=family', 5, 2, 'active', 'TRENDING'),

-- Submenus for 'Accessories' (parent_id = 6)
(20, 'Eye Masks & Scrunchies', '/collections/accessories?type=masks', 6, 1, 'active', NULL),
(21, 'Slippers & Socks', '/collections/accessories?type=slippers', 6, 2, 'active', NULL)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- --------------------------------------------------------
-- Table structure for table `site_settings` (Global Store Configuration)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_name` varchar(255) NOT NULL DEFAULT 'Their Nibs London',
  `site_tagline` varchar(255) DEFAULT 'Luxury Pyjamas, Nightwear & Loungewear',
  `logo_url` text DEFAULT NULL,
  `favicon_url` text DEFAULT NULL,
  `email` varchar(255) DEFAULT 'support@theirnibs.com',
  `phone` varchar(100) DEFAULT '+44 (0) 20 8123 4567',
  `whatsapp` varchar(100) DEFAULT '+44 7123 456789',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT 'London',
  `postal_code` varchar(50) DEFAULT 'W4 5PY',
  `country` varchar(100) DEFAULT 'United Kingdom',
  `facebook` varchar(255) DEFAULT 'https://facebook.com/theirnibs',
  `instagram` varchar(255) DEFAULT 'https://instagram.com/theirnibs',
  `twitter` varchar(255) DEFAULT 'https://twitter.com/theirnibs',
  `pinterest` varchar(255) DEFAULT 'https://pinterest.com/theirnibs',
  `tiktok` varchar(255) DEFAULT 'https://tiktok.com/@theirnibs',
  `youtube` varchar(255) DEFAULT 'https://youtube.com/@theirnibs',
  `copyright_text` varchar(255) DEFAULT '© 2026 Their Nibs London. All Rights Reserved.',
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `site_settings` (
  `id`, `site_name`, `site_tagline`, `logo_url`, `favicon_url`,
  `email`, `phone`, `whatsapp`, `address`, `city`, `postal_code`,
  `country`, `facebook`, `instagram`, `twitter`, `pinterest`,
  `tiktok`, `youtube`, `copyright_text`
) VALUES (
  1,
  'Their Nibs London',
  'Luxury Pyjamas, Nightwear & Loungewear',
  'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
  'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
  'support@theirnibs.com',
  '+44 (0) 20 8123 4567',
  '+44 7123 456789',
  'Studio 14, The Light Box, 111 Power Road, London, W4 5PY, United Kingdom',
  'London',
  'W4 5PY',
  'United Kingdom',
  'https://facebook.com/theirnibs',
  'https://instagram.com/theirnibs',
  'https://twitter.com/theirnibs',
  'https://pinterest.com/theirnibs',
  'https://tiktok.com/@theirnibs',
  'https://youtube.com/@theirnibs',
  '© 2026 Their Nibs London. All Rights Reserved.'
)
ON DUPLICATE KEY UPDATE `site_name`=VALUES(`site_name`);

-- --------------------------------------------------------
-- Table structure for table `products` (Dynamic Boutique Catalog)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT 'Womens',
  `price_gbp` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `compare_at_price_gbp` DECIMAL(10,2) DEFAULT NULL,
  `rating` DECIMAL(3,1) DEFAULT 4.8,
  `review_count` INT(11) DEFAULT 0,
  `is_bestseller` TINYINT(1) DEFAULT 0,
  `is_new` TINYINT(1) DEFAULT 0,
  `tag` VARCHAR(100) DEFAULT NULL,
  `images` LONGTEXT DEFAULT NULL,
  `description` LONGTEXT DEFAULT NULL,
  `sizes` LONGTEXT DEFAULT NULL,
  `details` LONGTEXT DEFAULT NULL,
  `stock` INT(11) DEFAULT 25,
  `status` VARCHAR(50) DEFAULT 'active',
  `created` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `status` (`status`),
  KEY `is_bestseller` (`is_bestseller`),
  KEY `is_new` (`is_new`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


