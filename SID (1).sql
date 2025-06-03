-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 03, 2025 at 06:45 AM
-- Server version: 8.0.42-0ubuntu0.24.04.1
-- PHP Version: 8.3.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `SID`
--

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE `login_logs` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `login_time` datetime NOT NULL,
  `token` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `presentation_documents`
--

CREATE TABLE `presentation_documents` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `file_type` enum('proposal_word','proposal_pdf','slide_pptx','slide_pdf') NOT NULL COMMENT 'ประเภทไฟล์',
  `file_original_name` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์ต้นฉบับ',
  `file_path` varchar(255) NOT NULL COMMENT 'เส้นทางไฟล์ที่เก็บ',
  `file_size` int DEFAULT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `file_mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type ของไฟล์',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int NOT NULL COMMENT 'user_id ผู้อัพโหลด'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='เก็บไฟล์นำเสนอ 4 ประเภทสำหรับผู้ที่ผ่านเข้ารอบ';

--
-- Triggers `presentation_documents`
--
DELIMITER $$
CREATE TRIGGER `log_presentation_replace` AFTER UPDATE ON `presentation_documents` FOR EACH ROW BEGIN
  IF NEW.file_path != OLD.file_path THEN
    INSERT INTO presentation_upload_logs (proposal_id, file_type, action, file_name, performed_by)
    VALUES (NEW.proposal_id, NEW.file_type, 'replace', NEW.file_original_name, NEW.uploaded_by);
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `log_presentation_upload` AFTER INSERT ON `presentation_documents` FOR EACH ROW BEGIN
  INSERT INTO presentation_upload_logs (proposal_id, file_type, action, file_name, performed_by)
  VALUES (NEW.proposal_id, NEW.file_type, 'upload', NEW.file_original_name, NEW.uploaded_by);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `presentation_files`
--

CREATE TABLE `presentation_files` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `file_original` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์ต้นฉบับ',
  `file_path` varchar(255) NOT NULL COMMENT 'เส้นทางไฟล์สำหรับเว็บ',
  `file_type` varchar(50) NOT NULL COMMENT 'ประเภทไฟล์ (ppt, pdf, etc.)',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `presentation_upload_logs`
--

CREATE TABLE `presentation_upload_logs` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `action` enum('upload','replace','delete') NOT NULL DEFAULT 'upload',
  `file_name` varchar(255) NOT NULL,
  `performed_by` int NOT NULL,
  `performed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_status_history`
--

CREATE TABLE `project_status_history` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `status` enum('waiting','reviewing','preparing','approved','rejected','waiting_revision') NOT NULL,
  `status_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `remarks` text,
  `updated_by` int NOT NULL COMMENT 'ID ของผู้ที่เปลี่ยนสถานะ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proposals`
--

CREATE TABLE `proposals` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `innovation_type` varchar(100) NOT NULL,
  `lead_name` varchar(255) NOT NULL,
  `lead_department` varchar(255) NOT NULL,
  `lead_position` varchar(255) NOT NULL,
  `org_type` varchar(100) NOT NULL,
  `other_org_type` varchar(255) DEFAULT NULL,
  `lead_address` text NOT NULL,
  `lead_phone` varchar(20) NOT NULL,
  `lead_email` varchar(255) NOT NULL,
  `project_title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `project_objective` text NOT NULL,
  `province` varchar(100) NOT NULL,
  `other_province` varchar(100) DEFAULT NULL,
  `budget_requested` decimal(10,2) NOT NULL,
  `beneficiaries` int NOT NULL,
  `project_indicators` text NOT NULL,
  `status` enum('waiting','reviewing','preparing','approved','rejected','waiting_revision') NOT NULL DEFAULT 'waiting',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `word_file_original` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ชื่อไฟล์ Word ต้นฉบับ',
  `word_file_path` varchar(255) NOT NULL COMMENT 'เส้นทางไฟล์ Word สำหรับเว็บ',
  `pdf_file_original` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ชื่อไฟล์ PDF ต้นฉบับ',
  `pdf_file_path` varchar(255) NOT NULL COMMENT 'เส้นทางไฟล์ PDF สำหรับเว็บ',
  `business_file_original` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ชื่อไฟล์หลักฐานกิจการต้นฉบับ',
  `business_file_path` varchar(255) NOT NULL COMMENT 'เส้นทางไฟล์หลักฐานกิจการสำหรับเว็บ',
  `proposals_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proposal_advisors`
--

CREATE TABLE `proposal_advisors` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proposal_feedback`
--

CREATE TABLE `proposal_feedback` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `feedback` text NOT NULL,
  `reviewer_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proposal_history`
--

CREATE TABLE `proposal_history` (
  `id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `project_title` varchar(255) NOT NULL,
  `project_objective` text NOT NULL,
  `province` varchar(100) NOT NULL,
  `other_province` varchar(100) DEFAULT NULL,
  `budget_requested` decimal(10,2) NOT NULL,
  `beneficiaries` int NOT NULL,
  `project_indicators` text NOT NULL,
  `admin_feedback` text NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `status_notifications`
--

CREATE TABLE `status_notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `proposal_id` int NOT NULL,
  `status` enum('waiting','reviewing','preparing','approved','rejected','waiting_revision') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `temp_proposals`
--

CREATE TABLE `temp_proposals` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `form_data` json NOT NULL,
  `current_step` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_presentation_documents_status`
-- (See below for the actual view)
--
CREATE TABLE `v_presentation_documents_status` (
`file_mime_type` varchar(100)
,`file_original_name` varchar(255)
,`file_path` varchar(255)
,`file_size` int
,`file_type` enum('proposal_word','proposal_pdf','slide_pptx','slide_pdf')
,`file_type_text` varchar(24)
,`id` int
,`project_title` text
,`proposal_id` int
,`proposal_status` enum('waiting','reviewing','preparing','approved','rejected','waiting_revision')
,`proposals_id` varchar(20)
,`uploaded_at` timestamp
,`uploaded_by` int
,`uploaded_by_name` varchar(50)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `presentation_documents`
--
ALTER TABLE `presentation_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proposal_file_type` (`proposal_id`,`file_type`) COMMENT 'ป้องกันอัพโหลดไฟล์ประเภทเดียวกันซ้ำ',
  ADD KEY `idx_proposal_id` (`proposal_id`),
  ADD KEY `idx_file_type` (`file_type`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_uploaded_at` (`uploaded_at` DESC);

--
-- Indexes for table `presentation_files`
--
ALTER TABLE `presentation_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `presentation_upload_logs`
--
ALTER TABLE `presentation_upload_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_proposal_id` (`proposal_id`),
  ADD KEY `idx_performed_at` (`performed_at`);

--
-- Indexes for table `project_status_history`
--
ALTER TABLE `project_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposal_id` (`proposal_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `proposals`
--
ALTER TABLE `proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `proposal_advisors`
--
ALTER TABLE `proposal_advisors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `proposal_feedback`
--
ALTER TABLE `proposal_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposal_id` (`proposal_id`),
  ADD KEY `reviewer_id` (`reviewer_id`);

--
-- Indexes for table `proposal_history`
--
ALTER TABLE `proposal_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `status_notifications`
--
ALTER TABLE `status_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `temp_proposals`
--
ALTER TABLE `temp_proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `presentation_documents`
--
ALTER TABLE `presentation_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `presentation_files`
--
ALTER TABLE `presentation_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `presentation_upload_logs`
--
ALTER TABLE `presentation_upload_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_status_history`
--
ALTER TABLE `project_status_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposals`
--
ALTER TABLE `proposals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposal_advisors`
--
ALTER TABLE `proposal_advisors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposal_feedback`
--
ALTER TABLE `proposal_feedback`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proposal_history`
--
ALTER TABLE `proposal_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `status_notifications`
--
ALTER TABLE `status_notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `temp_proposals`
--
ALTER TABLE `temp_proposals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `v_presentation_documents_status`
--
DROP TABLE IF EXISTS `v_presentation_documents_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`admin`@`localhost` SQL SECURITY DEFINER VIEW `v_presentation_documents_status`  AS SELECT `pd`.`id` AS `id`, `pd`.`proposal_id` AS `proposal_id`, `pd`.`file_type` AS `file_type`, `pd`.`file_original_name` AS `file_original_name`, `pd`.`file_path` AS `file_path`, `pd`.`file_size` AS `file_size`, `pd`.`file_mime_type` AS `file_mime_type`, `pd`.`uploaded_at` AS `uploaded_at`, `pd`.`uploaded_by` AS `uploaded_by`, `p`.`proposals_id` AS `proposals_id`, `p`.`project_title` AS `project_title`, `p`.`status` AS `proposal_status`, `u`.`username` AS `uploaded_by_name`, (case `pd`.`file_type` when 'proposal_word' then 'ข้อเสนอโครงการ (Word)' when 'proposal_pdf' then 'ข้อเสนอโครงการ (PDF)' when 'slide_pptx' then 'สไลด์นำเสนอ (PowerPoint)' when 'slide_pdf' then 'สไลด์นำเสนอ (PDF)' end) AS `file_type_text` FROM ((`presentation_documents` `pd` join `proposals` `p` on((`pd`.`proposal_id` = `p`.`id`))) join `users` `u` on((`pd`.`uploaded_by` = `u`.`id`))) WHERE (`p`.`status` = 'preparing') ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `presentation_documents`
--
ALTER TABLE `presentation_documents`
  ADD CONSTRAINT `presentation_documents_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `presentation_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `presentation_files`
--
ALTER TABLE `presentation_files`
  ADD CONSTRAINT `presentation_files_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`);

--
-- Constraints for table `project_status_history`
--
ALTER TABLE `project_status_history`
  ADD CONSTRAINT `project_status_history_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `project_status_history_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `proposals`
--
ALTER TABLE `proposals`
  ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `proposal_advisors`
--
ALTER TABLE `proposal_advisors`
  ADD CONSTRAINT `proposal_advisors_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `proposal_feedback`
--
ALTER TABLE `proposal_feedback`
  ADD CONSTRAINT `proposal_feedback_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`),
  ADD CONSTRAINT `proposal_feedback_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `proposal_history`
--
ALTER TABLE `proposal_history`
  ADD CONSTRAINT `proposal_history_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`);

--
-- Constraints for table `status_notifications`
--
ALTER TABLE `status_notifications`
  ADD CONSTRAINT `status_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `status_notifications_ibfk_2` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`);

--
-- Constraints for table `temp_proposals`
--
ALTER TABLE `temp_proposals`
  ADD CONSTRAINT `temp_proposals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
