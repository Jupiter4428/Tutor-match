SET FOREIGN_KEY_CHECKS = 0; 
-- ==========================================
-- ล้างตารางเก่า (เรียงลำดับการลบจากตารางลูกไปตารางแม่)
-- ==========================================
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `Review`;
DROP TABLE IF EXISTS `Schedule_Booking`;
DROP TABLE IF EXISTS `Application`;
DROP TABLE IF EXISTS `Student_Post`;
DROP TABLE IF EXISTS `Tutor_Schedule`;
DROP TABLE IF EXISTS `Tutor_Certificate`;
DROP TABLE IF EXISTS `Tutor_Subject`;
DROP TABLE IF EXISTS `Tutor_Experience`;
DROP TABLE IF EXISTS `Tutor_Profile`;
DROP TABLE IF EXISTS `Student_Profile`;
DROP TABLE IF EXISTS `User_Role`;
DROP TABLE IF EXISTS `User`;

-- ==========================================
-- 1. ตารางผู้ใช้งานและสิทธิ์
-- ==========================================
CREATE TABLE `User` (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_profile VARCHAR(512) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `User_Role` (
    user_id INT NOT NULL,
    role ENUM('admin', 'student', 'tutor') NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. ตารางโปรไฟล์
-- ==========================================
CREATE TABLE `Student_Profile` (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    grade_level VARCHAR(50),
    school_name VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

CREATE TABLE `Tutor_Profile` (
    tutor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    hourly_rate DECIMAL(10,2) NOT NULL CHECK(hourly_rate >= 0),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 3. ข้อมูลย่อยของติวเตอร์
-- ==========================================
CREATE TABLE `Tutor_Experience` (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    experience_detail TEXT NOT NULL,
    FOREIGN KEY (tutor_id) REFERENCES `Tutor_Profile`(tutor_id) ON DELETE CASCADE
);

CREATE TABLE `Tutor_Subject` (
    tutor_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    PRIMARY KEY (tutor_id, subject),
    FOREIGN KEY (tutor_id) REFERENCES `Tutor_Profile`(tutor_id) ON DELETE CASCADE
);

CREATE TABLE `Tutor_Certificate` (
    tutor_id INT NOT NULL,
    certificate VARCHAR(255) NOT NULL,
    PRIMARY KEY (tutor_id, certificate),
    FOREIGN KEY (tutor_id) REFERENCES `Tutor_Profile`(tutor_id) ON DELETE CASCADE
);

CREATE TABLE `Tutor_Schedule` (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    tutor_id INT NOT NULL,
    day_of_week ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time),
    FOREIGN KEY (tutor_id) REFERENCES `Tutor_Profile`(tutor_id) ON DELETE CASCADE
);

-- ==========================================
-- 4. ระบบประกาศหาติวเตอร์และการสมัคร
-- ==========================================
CREATE TABLE `Student_Post` (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    budget DECIMAL(10,2) NOT NULL CHECK(budget > 0),
    status ENUM('open', 'closed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES `Student_Profile`(student_id) ON DELETE CASCADE
);

CREATE TABLE `Application` (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    tutor_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_application UNIQUE (post_id, tutor_id),
    FOREIGN KEY (post_id) REFERENCES `Student_Post`(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES `Tutor_Profile`(tutor_id) ON DELETE CASCADE
);

-- ==========================================
-- 5. ระบบตกลงจองเวลา, รีวิว และชำระเงิน
-- ==========================================
CREATE TABLE `Schedule_Booking` (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    app_id INT NOT NULL,
    booking_date DATE NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES `Tutor_Schedule`(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES `Application`(app_id) ON DELETE CASCADE
);

CREATE TABLE `Review` (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL UNIQUE,
    rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES `Application`(app_id) ON DELETE CASCADE
);

CREATE TABLE `Payment` (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
    platform_fee DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES `Application`(app_id) ON DELETE CASCADE
);
SET FOREIGN_KEY_CHECKS = 1;
