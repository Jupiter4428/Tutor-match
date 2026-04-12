-- ==========================================
-- 0. Database Setup
-- ==========================================
DROP DATABASE IF EXISTS tutor_match;
CREATE DATABASE tutor_match
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tutor_match;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. Users & Roles
-- ==========================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_profile VARCHAR(512),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role ENUM('admin','student','tutor') NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. Profiles
-- ==========================================
CREATE TABLE student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    grade_level VARCHAR(50),
    school_name VARCHAR(100),
    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutor_profiles (
    tutor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    hourly_rate DECIMAL(10,2) NOT NULL,
    CHECK (hourly_rate >= 0),
    CONSTRAINT fk_tutor_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 3. Tutor Details
-- ==========================================
CREATE TABLE tutor_experiences (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    experience_detail TEXT NOT NULL,
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutor_subjects (
    tutor_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    PRIMARY KEY (tutor_id, subject),
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutor_certificates (
    tutor_id INT NOT NULL,
    certificate VARCHAR(255) NOT NULL,
    PRIMARY KEY (tutor_id, certificate),
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tutor_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time),
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 4. Student Posts & Applications
-- ==========================================
CREATE TABLE student_posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    budget DECIMAL(10,2) NOT NULL,
    status ENUM('open','closed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (budget > 0),
    FOREIGN KEY (student_id) REFERENCES student_profiles(student_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE applications (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    tutor_id INT NOT NULL,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_application (post_id, tutor_id),
    FOREIGN KEY (post_id) REFERENCES student_posts(post_id)
        ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(tutor_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 5. Booking, Review, Payment
-- ==========================================
CREATE TABLE schedule_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    app_id INT NOT NULL,
    booking_date DATE NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES tutor_schedules(schedule_id)
        ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL UNIQUE,
    rating INT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    status ENUM('pending','completed') DEFAULT 'pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (amount > 0),
    FOREIGN KEY (app_id) REFERENCES applications(app_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 6. Seed Data
-- ==========================================
INSERT INTO users (name, email, password_hash)
VALUES ('พี่เม่น', 'wutthisak2548@gmail.com', 'superuser');

INSERT INTO user_roles (user_id, role)
VALUES (1, 'admin');