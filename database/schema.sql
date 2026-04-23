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
-- 2) student_profiles
-- Student-specific profile
-- =========================================================
CREATE TABLE student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    grade_level VARCHAR(50) NULL,
    school_name VARCHAR(100) NULL,
    education_level VARCHAR(100) NULL,
    profile_picture_url VARCHAR(512) NULL,
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
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
    CONSTRAINT chk_tutor_profiles_hourly_rate CHECK (hourly_rate > 0),
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

-- CREATE TABLE tutor_experiences (
--     experience_id INT AUTO_INCREMENT PRIMARY KEY,
--     tutor_id INT NOT NULL,
--     experience_detail TEXT NOT NULL,
--     CONSTRAINT fk_tutor_experiences_tutor
--         FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
--         ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    budget DECIMAL(10,2) NOT NULL,
    status ENUM('open','closed') NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_reason TEXT NULL,
    CONSTRAINT chk_student_posts_budget CHECK (budget > 0),
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
-- Removed is_booked because booking status is derived from schedule_bookings
-- =========================================================
CREATE TABLE tutor_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_tutor_schedules_time_range CHECK (end_time > start_time),
    CONSTRAINT fk_tutor_schedules_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 9) schedule_bookings
-- One schedule slot can only be booked once
-- One application may book multiple schedule slots
-- =========================================================
CREATE TABLE schedule_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    app_id INT NOT NULL,
    CONSTRAINT uq_schedule_bookings_schedule UNIQUE (schedule_id),
    CONSTRAINT fk_schedule_bookings_schedule
        FOREIGN KEY (schedule_id) REFERENCES tutor_schedules(schedule_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_schedule_bookings_application
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

SET FOREIGN_KEY_CHECKS = 1;