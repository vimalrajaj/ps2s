-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: university_management
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_performance`
--

DROP TABLE IF EXISTS `academic_performance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_performance` (
  `performance_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `semester` int NOT NULL,
  `academic_year` varchar(10) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `credits` int DEFAULT '3',
  `internal_marks` decimal(5,2) DEFAULT '0.00',
  `external_marks` decimal(5,2) DEFAULT '0.00',
  `total_marks` decimal(5,2) DEFAULT '0.00',
  `max_marks` decimal(5,2) DEFAULT '100.00',
  `percentage` decimal(5,2) GENERATED ALWAYS AS (((`total_marks` / `max_marks`) * 100)) STORED,
  `grade` varchar(5) DEFAULT NULL,
  `grade_points` decimal(3,2) DEFAULT '0.00',
  `result_status` enum('Pass','Fail','Pending','Reappear') DEFAULT 'Pending',
  `exam_type` enum('Regular','Supplementary','Improvement') DEFAULT 'Regular',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`performance_id`),
  UNIQUE KEY `unique_student_subject_semester` (`student_id`,`subject_code`,`semester`,`academic_year`),
  KEY `idx_student_performance` (`student_id`,`semester`),
  KEY `idx_academic_year` (`academic_year`),
  CONSTRAINT `academic_performance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_performance`
--

LOCK TABLES `academic_performance` WRITE;
/*!40000 ALTER TABLE `academic_performance` DISABLE KEYS */;
/*!40000 ALTER TABLE `academic_performance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject_code` varchar(20) DEFAULT NULL,
  `subject_name` varchar(100) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('Present','Absent','Late','Excused') NOT NULL,
  `session_type` enum('Lecture','Lab','Tutorial','Exam') DEFAULT 'Lecture',
  `total_sessions` int DEFAULT '1',
  `attended_sessions` int DEFAULT '0',
  `percentage` decimal(5,2) GENERATED ALWAYS AS (((`attended_sessions` / `total_sessions`) * 100)) STORED,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_student_attendance` (`student_id`,`attendance_date`),
  KEY `idx_subject_attendance` (`subject_code`,`attendance_date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `course_code` varchar(20) NOT NULL,
  `course_name` varchar(150) NOT NULL,
  `dept_id` int DEFAULT NULL,
  `credits` int DEFAULT '3',
  `duration_years` int DEFAULT '4',
  `course_type` enum('UG','PG','Diploma','PhD') NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_id`),
  UNIQUE KEY `course_code` (`course_code`),
  KEY `dept_id` (`dept_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'CSE-BTech','Bachelor of Technology in Computer Science',1,160,4,'UG','Active','2025-09-21 13:49:59'),(2,'ECE-BTech','Bachelor of Technology in Electronics & Communication',2,160,4,'UG','Active','2025-09-21 13:49:59'),(3,'ME-BTech','Bachelor of Technology in Mechanical Engineering',3,160,4,'UG','Active','2025-09-21 13:49:59'),(4,'IT-BTech','Bachelor of Technology in Information Technology',4,160,4,'UG','Active','2025-09-21 13:49:59'),(5,'CSE-MTech','Master of Technology in Computer Science',1,64,2,'PG','Active','2025-09-21 13:49:59'),(6,'ECE-MTech','Master of Technology in Electronics & Communication',2,64,2,'PG','Active','2025-09-21 13:49:59');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_code` varchar(10) NOT NULL,
  `dept_name` varchar(100) NOT NULL,
  `dept_head` varchar(100) DEFAULT NULL,
  `building` varchar(50) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dept_id`),
  UNIQUE KEY `dept_code` (`dept_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'CSE','Computer Science Engineering','Dr. Rajesh Kumar','Block A','cse@university.edu','+91-9876543210','2025-09-21 13:49:59','2025-09-21 13:49:59'),(2,'ECE','Electronics and Communication Engineering','Dr. Priya Sharma','Block B','ece@university.edu','+91-9876543211','2025-09-21 13:49:59','2025-09-21 13:49:59'),(3,'ME','Mechanical Engineering','Dr. Amit Singh','Block C','me@university.edu','+91-9876543212','2025-09-21 13:49:59','2025-09-21 13:49:59'),(4,'IT','Information Technology','Dr. Sunita Patel','Block A','it@university.edu','+91-9876543213','2025-09-21 13:49:59','2025-09-21 13:49:59'),(5,'EEE','Electrical and Electronics Engineering','Dr. Vikram Rao','Block D','eee@university.edu','+91-9876543214','2025-09-21 13:49:59','2025-09-21 13:49:59');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculty`
--

DROP TABLE IF EXISTS `faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty` (
  `faculty_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `office_phone` varchar(15) DEFAULT NULL,
  `personal_email` varchar(100) DEFAULT NULL,
  `office_address` varchar(200) DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `designation` varchar(100) NOT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `specialization` varchar(200) DEFAULT NULL,
  `experience_years` int DEFAULT '0',
  `date_of_joining` date NOT NULL,
  `can_manage_students` tinyint(1) DEFAULT '0',
  `can_create_accounts` tinyint(1) DEFAULT '0',
  `can_view_all_students` tinyint(1) DEFAULT '0',
  `can_modify_grades` tinyint(1) DEFAULT '0',
  `employment_status` enum('Active','On Leave','Inactive','Retired') DEFAULT 'Active',
  `profile_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`faculty_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_dept_id` (`dept_id`),
  CONSTRAINT `faculty_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `faculty_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty`
--

LOCK TABLES `faculty` WRITE;
/*!40000 ALTER TABLE `faculty` DISABLE KEYS */;
INSERT INTO `faculty` VALUES (1,2,'FAC001','Dr. Rajesh','Kumar',NULL,'+91-9876543210',NULL,NULL,NULL,1,'Professor & Head','Ph.D in Computer Science',NULL,0,'2015-07-01',1,1,0,0,'Active',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(2,3,'FAC002','Dr. Priya','Sharma',NULL,'+91-9876543211',NULL,NULL,NULL,2,'Associate Professor','Ph.D in Electronics Engineering',NULL,0,'2017-08-15',1,1,0,0,'Active',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(3,4,'FAC003','Dr. Amit','Singh',NULL,'+91-9876543212',NULL,NULL,NULL,3,'Assistant Professor','M.Tech in Mechanical Engineering',NULL,0,'2019-06-10',0,0,0,0,'Active',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59');
/*!40000 ALTER TABLE `faculty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `recipient_id` int NOT NULL,
  `recipient_type` enum('student','faculty','all') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('Academic','Administrative','Certificate','Deadline','Achievement','Alert') NOT NULL,
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT '0',
  `sender_id` int DEFAULT NULL,
  `sender_type` enum('system','faculty','admin') DEFAULT 'system',
  `expiry_date` timestamp NULL DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_recipient_notifications` (`recipient_id`,`is_read`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_certificates`
--

DROP TABLE IF EXISTS `student_certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_certificates` (
  `cert_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `certificate_name` varchar(200) NOT NULL,
  `issuing_organization` varchar(200) NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `certificate_url` varchar(500) DEFAULT NULL,
  `certificate_file_path` varchar(500) DEFAULT NULL,
  `verification_status` enum('Pending','Verified','Invalid','Expired') DEFAULT 'Pending',
  `verification_method` enum('QR','OCR','Manual','URL') NOT NULL,
  `verified_by` int DEFAULT NULL,
  `verification_date` timestamp NULL DEFAULT NULL,
  `verification_notes` text,
  `certificate_type` enum('Technical','Academic','Professional','Achievement','Other') NOT NULL,
  `skill_category` varchar(100) DEFAULT NULL,
  `credit_points` int DEFAULT '0',
  `grade_achieved` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cert_id`),
  KEY `verified_by` (`verified_by`),
  KEY `idx_student_certificates` (`student_id`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_issue_date` (`issue_date`),
  CONSTRAINT `student_certificates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_certificates_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `faculty` (`faculty_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_certificates`
--

LOCK TABLES `student_certificates` WRITE;
/*!40000 ALTER TABLE `student_certificates` DISABLE KEYS */;
INSERT INTO `student_certificates` VALUES (1,1,'AWS Cloud Practitioner','Amazon Web Services','2024-06-15',NULL,'https://www.credly.com/badges/12345678-1234-1234-1234-123456789abc',NULL,'Verified','QR',NULL,NULL,NULL,'Professional','Cloud Computing',5,NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(2,1,'Python for Data Science','Coursera','2024-05-20',NULL,'https://coursera.org/verify/ABC123DEF456',NULL,'Verified','URL',NULL,NULL,NULL,'Technical','Programming',3,NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(3,2,'Azure Fundamentals','Microsoft','2024-07-10',NULL,'https://www.credly.com/badges/87654321-4321-4321-4321-cba987654321',NULL,'Verified','QR',NULL,NULL,NULL,'Professional','Cloud Computing',5,NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(4,3,'Java Programming','Oracle','2024-04-25',NULL,'https://education.oracle.com/verify/xyz789',NULL,'Verified','Manual',NULL,NULL,NULL,'Technical','Programming',4,NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(5,4,'Machine Learning Basics','edX','2024-08-05',NULL,'https://courses.edx.org/certificates/abcd1234efgh5678',NULL,'Pending','OCR',NULL,NULL,NULL,'Technical','AI/ML',4,NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59');
/*!40000 ALTER TABLE `student_certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `register_number` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `emergency_contact` varchar(15) DEFAULT NULL,
  `personal_email` varchar(100) DEFAULT NULL,
  `address_line1` varchar(200) DEFAULT NULL,
  `address_line2` varchar(200) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'India',
  `course_id` int DEFAULT NULL,
  `batch_year` year NOT NULL,
  `semester` int DEFAULT '1',
  `current_year` int DEFAULT '1',
  `admission_date` date NOT NULL,
  `expected_graduation` date DEFAULT NULL,
  `current_cgpa` decimal(3,2) DEFAULT '0.00',
  `total_credits` int DEFAULT '0',
  `completed_credits` int DEFAULT '0',
  `enrollment_status` enum('Active','Inactive','Graduated','Dropped','Suspended') DEFAULT 'Active',
  `profile_image` varchar(255) DEFAULT NULL,
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_phone` varchar(15) DEFAULT NULL,
  `guardian_email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `register_number` (`register_number`),
  KEY `idx_register_number` (`register_number`),
  KEY `idx_course_batch` (`course_id`,`batch_year`),
  KEY `idx_name` (`first_name`,`last_name`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,5,'21CSE001','John','Doe',NULL,'2003-05-15','Male',NULL,'+91-9876543220','+91-9876543221',NULL,NULL,NULL,NULL,NULL,NULL,'India',1,2021,7,4,'2021-08-01',NULL,8.50,0,0,'Active',NULL,'Robert Doe','+91-9876543221',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(2,6,'21CSE002','Jane','Smith',NULL,'2003-03-22','Female',NULL,'+91-9876543222','+91-9876543223',NULL,NULL,NULL,NULL,NULL,NULL,'India',1,2021,7,4,'2021-08-01',NULL,9.20,0,0,'Active',NULL,'Michael Smith','+91-9876543223',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(3,7,'21ECE001','Alex','Johnson',NULL,'2003-07-10','Male',NULL,'+91-9876543224','+91-9876543225',NULL,NULL,NULL,NULL,NULL,NULL,'India',2,2021,7,4,'2021-08-01',NULL,7.80,0,0,'Active',NULL,'David Johnson','+91-9876543225',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(4,8,'22CSE001','Priya','Patel',NULL,'2004-01-18','Female',NULL,'+91-9876543226','+91-9876543227',NULL,NULL,NULL,NULL,NULL,NULL,'India',1,2022,5,3,'2022-08-01',NULL,8.90,0,0,'Active',NULL,'Rajesh Patel','+91-9876543227',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59'),(5,9,'22IT001','Rahul','Gupta',NULL,'2004-09-25','Male',NULL,'+91-9876543228','+91-9876543229',NULL,NULL,NULL,NULL,NULL,NULL,'India',4,2022,5,3,'2022-08-01',NULL,8.10,0,0,'Active',NULL,'Suresh Gupta','+91-9876543229',NULL,'2025-09-21 13:49:59','2025-09-21 13:49:59');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int NOT NULL,
  `session_data` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_user_sessions` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `user_type` enum('student','faculty','admin') NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `account_locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_user_type` (`user_type`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin123','admin@university.edu','admin','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28'),(2,'rajesh.kumar','faculty123','rajesh.kumar@university.edu','faculty','active','2025-09-22 04:13:27',0,NULL,'2025-09-21 13:49:59','2025-09-22 04:13:27'),(3,'priya.sharma','faculty123','priya.sharma@university.edu','faculty','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28'),(4,'amit.singh','faculty123','amit.singh@university.edu','faculty','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28'),(5,'21CSE001','student123','21cse001@student.university.edu','student','active','2025-09-22 04:12:45',0,NULL,'2025-09-21 13:49:59','2025-09-22 04:12:45'),(6,'21CSE002','student123','21cse002@student.university.edu','student','active','2025-09-21 14:40:46',0,NULL,'2025-09-21 13:49:59','2025-09-21 14:40:46'),(7,'21ECE001','student123','21ece001@student.university.edu','student','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28'),(8,'22CSE001','student123','22cse001@student.university.edu','student','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28'),(9,'22IT001','student123','22it001@student.university.edu','student','active',NULL,0,NULL,'2025-09-21 13:49:59','2025-09-21 14:39:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-22 23:18:16
