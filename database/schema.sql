-- =========================================================
-- Tutor Match System
-- FINAL SCHEMA (Report-aligned)
-- Normalization + Database Optimization + Admin/Audit Flow
-- =========================================================

DROP DATABASE IF EXISTS tutor_match;
CREATE DATABASE tutor_match
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tutor_match;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1) users
-- Single-role design + account lifecycle
-- =========================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','student','tutor') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_status ENUM('active','suspended','ban') NOT NULL DEFAULT 'active',
    status_updated_at DATETIME NULL,
    status_reason TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 3) tutor_profiles
-- Tutor verification workflow + audit fields
-- =========================================================
CREATE TABLE tutor_profiles (
    tutor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
    profile_picture_url VARCHAR(512) NOT NULL,
    verification_submitted_at DATETIME NULL,
    verified_by INT NULL,
    verified_at DATETIME NULL,
    reject_reason TEXT NULL,
    CONSTRAINT chk_tutor_profiles_hourly_rate CHECK (hourly_rate >= 0),
    CONSTRAINT fk_tutor_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tutor_profiles_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(user_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 4) tutor_experiences
-- 4NF: separated from tutor_profiles
-- =========================================================

CREATE TABLE tutor_experiences (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    experience_detail TEXT NOT NULL,
    CONSTRAINT fk_tutor_experiences_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 5) tutor_subjects
-- BCNF: composite PK prevents duplicate subjects per tutor
-- =========================================================

CREATE TABLE tutor_subjects (
    tutor_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    PRIMARY KEY (tutor_id, subject),
    CONSTRAINT fk_tutor_subjects_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 2) student_profiles
-- =========================================================
CREATE TABLE student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    grade_level VARCHAR(100) NULL,
    school_name VARCHAR(255) NULL,
    education_level VARCHAR(100) NULL,
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 6) student_posts
-- Student job posts + moderation fields
-- =========================================================
CREATE TABLE student_posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(100) NOT NULL, -- เพิ่มใหม่
    learning_format ENUM('online', 'onsite', 'both') NOT NULL, -- เพิ่มใหม่
    location VARCHAR(255) NOT NULL, 
    preferred_time VARCHAR(255) NOT NULL, -- เพิ่มใหม่
    description TEXT NULL,
    budget DOUBLE NOT NULL,
    status ENUM('open','closed') NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_reason TEXT NULL,
    CONSTRAINT chk_student_posts_budget CHECK (budget >= 0),
    CONSTRAINT fk_student_posts_student
        FOREIGN KEY (student_id) REFERENCES student_profiles(student_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 7) applications
-- Unique apply per (post, tutor)
-- Added teaching_status to support review gating after class completion
-- =========================================================
CREATE TABLE applications (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    tutor_id INT NOT NULL,
    status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    teaching_status ENUM('not_started','ongoing','completed') NOT NULL DEFAULT 'not_started',
    CONSTRAINT uq_applications_post_tutor UNIQUE (post_id, tutor_id),
    CONSTRAINT fk_applications_post
        FOREIGN KEY (post_id) REFERENCES student_posts(post_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_applications_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 8) tutor_schedules
-- ตารางเวลาว่างของติวเตอร์
-- =========================================================
CREATE TABLE tutor_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT fk_tutor_schedules_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 9) schedule_bookings
-- เชื่อม application กับ schedule ที่นักเรียนจอง
-- =========================================================
CREATE TABLE schedule_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    app_id INT NOT NULL,
    CONSTRAINT uq_schedule_bookings UNIQUE (schedule_id, app_id),
    CONSTRAINT fk_schedule_bookings_schedule
        FOREIGN KEY (schedule_id) REFERENCES tutor_schedules(schedule_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_schedule_bookings_app
        FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 10) reviews
-- 3NF: reference only app_id + moderation fields
-- =========================================================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL UNIQUE,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_reason TEXT NULL,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_application
        FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 11) payments
-- 3NF: reference only app_id + slip verification fields
-- =========================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    slip_url VARCHAR(512) NULL,
    verified_by INT NULL,
    verified_at DATETIME NULL,
    remarks TEXT NULL,
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_platform_fee_nonnegative CHECK (platform_fee >= 0),
    CONSTRAINT chk_payments_platform_fee_rule CHECK (platform_fee = ROUND(amount * 0.10, 2)),
    CONSTRAINT fk_payments_application
        FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_payments_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(user_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 12) user_action_logs
-- Flexible audit trail for admin operations
-- =========================================================
CREATE TABLE user_action_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type ENUM('user','tutor_profile','post','review','payment') NOT NULL,
    target_id INT NOT NULL,
    reason TEXT NULL,
    performed_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_action_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_user_action_logs_performed_by
        FOREIGN KEY (performed_by) REFERENCES users(user_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 13) reports
-- สำหรับเก็บข้อมูลการแจ้งปัญหาระบบ ร้องเรียนผู้ใช้ หรือโพสต์ต่างๆ
-- =========================================================
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL, -- คนที่แจ้งปัญหา
    target_type ENUM('user', 'post', 'review', 'other') NOT NULL, -- ประเภทสิ่งที่ถูกรายงาน
    target_id INT NULL, -- ID ของสิ่งที่ถูกรายงาน (เช่น post_id, user_id)
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 14) wallets
-- อ้างอิงจากเอกสารระบบการเงิน [cite: 2, 3]
-- =========================================================
CREATE TABLE wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallets_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 15) transaction_logs
-- เก็บประวัติการเงินอย่างละเอียดเพื่อตรวจสอบย้อนหลัง 
-- =========================================================
CREATE TABLE transaction_logs (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'payment', 'refund', 'platform_fee', 'tutor_earnings') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL, -- ยอดเงินคงเหลือหลังทำรายการ (ตามหน้า UI) [cite: 27]
    reference_type ENUM('application', 'withdrawal_request', 'deposit_slip') NULL, -- อ้างอิงแหล่งที่มา 
    reference_id INT NULL, -- ID อ้างอิง เช่น เลขที่ใบสมัคร 
    description VARCHAR(255) NULL, -- คำอธิบาย เช่น "ชำระค่าเรียนคอร์สคณิตศาสตร์" [cite: 35, 36]
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_logs_wallet 
        FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 16) user_bank_accounts
-- เพื่อให้หน้า "ถอนเงินออกจาก Wallet" ใช้งานได้จริง 
-- คุณต้องมีที่เก็บเลขบัญชีและชื่อธนาคารของผู้ใช้ (เช่น กสิกร, กรุงไทย ตามในรูป)
-- =========================================================
CREATE TABLE user_bank_accounts (
    bank_account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE, -- บัญชีหลักที่ใช้บ่อย
    CONSTRAINT fk_bank_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;