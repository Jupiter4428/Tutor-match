-- ============================================================
-- add_users.sql — เพิ่ม user ทดสอบเพิ่มเติม (ไม่ซ้ำกับ seed.sql)
-- รหัสผ่านทุก account คือ: 1234
-- ============================================================

USE tutor_match;
SET NAMES utf8mb4;

-- ============================================================
-- นักเรียนใหม่
-- ============================================================
INSERT INTO users (name, email, password_hash, role, account_status) VALUES
('พลอย ทดสอบ', 'ploy@test.com', '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active');

INSERT INTO student_profiles (user_id, grade_level, school_name, education_level)
VALUES (LAST_INSERT_ID(), 'ม.5', 'โรงเรียนทดสอบ', 'มัธยมศึกษาตอนปลาย');

INSERT INTO wallets (user_id, balance, status)
VALUES ((SELECT user_id FROM users WHERE email = 'ploy@test.com'), 0.00, 'active');

-- ============================================================
-- ติวเตอร์ใหม่ (verified)
-- ============================================================
INSERT INTO users (name, email, password_hash, role, account_status) VALUES
('ปิ่น ครูคณิต', 'pin_tutor@test.com', '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor', 'active');

SET @new_tutor_user_id = LAST_INSERT_ID();

INSERT INTO tutor_profiles (user_id, bio, hourly_rate, verification_status, profile_picture_url)
VALUES (@new_tutor_user_id, 'สอนคณิตศาสตร์ระดับ ม.ปลาย เน้นสอบ ONET', 280.00, 'verified', 'static/uploads/default_profile.jpg');

INSERT INTO tutor_subjects (tutor_id, subject)
VALUES
  (LAST_INSERT_ID(), 'คณิตศาสตร์'),
  (LAST_INSERT_ID(), 'สถิติ'),
  (LAST_INSERT_ID(), 'ความน่าจะเป็น');

INSERT INTO wallets (user_id, balance, status)
VALUES (@new_tutor_user_id, 0.00, 'active');
