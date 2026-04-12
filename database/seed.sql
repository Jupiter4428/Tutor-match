-- ==========================================
-- 1. ข้อมูลผู้ใช้ (Users) - เว้น ID 1 ไว้ให้ Admin
-- ==========================================
INSERT INTO `User` (user_id, name, email, password_hash) VALUES 
(2, 'น้องสมชาย', 'somchai@test.com', 'hashed_student'),
(3, 'น้องสมหญิง', 'somying@test.com', 'hashed_student'),
(4, 'ติวเตอร์มานี', 'manee@test.com', 'hashed_tutor'),
(5, 'ติวเตอร์ชูใจ', 'choojai@test.com', 'hashed_tutor'),
(6, 'น้องมะลิ', 'mali@test.com', 'hashed_student'),
(7, 'น้องกล้า', 'kla@test.com', 'hashed_student'),
(8, 'ครูพี่อาร์ท', 'art_tutor@test.com', 'hashed_tutor');

-- ==========================================
-- 2. ผูกบทบาท (User Roles)
-- ==========================================
INSERT INTO `User_Role` (user_id, role) VALUES 
(2, 'student'), (3, 'student'), (6, 'student'), (7, 'student'),
(4, 'tutor'), (5, 'tutor'), (8, 'tutor');

-- ==========================================
-- 3. โปรไฟล์นักเรียนและติวเตอร์ (Profiles)
-- ==========================================
INSERT INTO `Student_Profile` (user_id, grade_level, school_name) VALUES 
(2, 'ม.4', 'โรงเรียนมัธยมวิทยา'), -- student_id: 1
(3, 'ม.6', 'โรงเรียนสตรีศึกษา'),   -- student_id: 2
(6, 'ป.6', 'อนุบาลนานาชาติ'),    -- student_id: 3
(7, 'ม.3', 'สาธิตมหาวิทยาลัย');    -- student_id: 4

INSERT INTO `Tutor_Profile` (user_id, bio, verification_status, hourly_rate) VALUES 
(4, 'สอนคณิตศาสตร์ประสบการณ์ 5 ปี', 'verified', 300.00), -- tutor_id: 1
(5, 'สอนภาษาอังกฤษ สไตล์ฝรั่ง', 'verified', 400.00),      -- tutor_id: 2
(8, 'ติวเตอร์ฟิสิกส์เน้นทำโจทย์ยาก', 'pending', 500.00);    -- tutor_id: 3 (Case: Pending Tutor)

-- ==========================================
-- 4. วิชาที่สอนและโพสต์ประกาศ (Subjects & Posts)
-- ==========================================
INSERT INTO `Tutor_Subject` (tutor_id, subject) VALUES 
(1, 'คณิตศาสตร์'), (1, 'ฟิสิกส์'),
(2, 'ภาษาอังกฤษ'), (2, 'สนทนาภาษาอังกฤษ'),
(3, 'ฟิสิกส์'), (3, 'ดาราศาสตร์');

INSERT INTO `Student_Post` (student_id, subject, description, budget) VALUES 
(1, 'คณิตศาสตร์ ม.4', 'ต้องการคนปูพื้นฐาน', 250.00), -- post_id: 1
(2, 'ภาษาอังกฤษ ม.6', 'ติวสอบเข้ามหาลัยด่วน', 500.00), -- post_id: 2
(3, 'คณิตศาสตร์ ป.6', 'เตรียมสอบเข้า ม.1', 350.00),    -- post_id: 3
(4, 'ชีววิทยา ม.3', 'ติวสอบกลางภาคด่วนมาก', 450.00),   -- post_id: 4 (Case: No Applicant)
(1, 'เคมี ม.4', 'สอนออนไลน์เท่านั้น', 300.00);           -- post_id: 5 (Case: Multiple posts from 1 student)

-- ==========================================
-- 5. ตารางเวลาและการสมัคร (Schedule & Applications)
-- ==========================================
INSERT INTO `Tutor_Schedule` (tutor_id, day_of_week, start_time, end_time) VALUES 
(1, 'Mon', '17:00:00', '19:00:00'),
(2, 'Sat', '09:00:00', '12:00:00');

INSERT INTO `Application` (post_id, tutor_id, status) VALUES 
(1, 1, 'accepted'), -- Case: Success
(2, 2, 'pending'),  -- Case: Waiting for student
(3, 2, 'rejected'), -- Case: Tutor rejected by student
(3, 1, 'pending'),  -- Case: New tutor applying for rejected post
(5, 3, 'pending');  -- Case: Unverified tutor applying

-- ==========================================
-- 6. การเงินและรีวิว (Payments & Reviews)
-- ==========================================
-- จ่ายเงินแล้ว (หัก 10% จาก 1500)
INSERT INTO `Payment` (app_id, amount, platform_fee, status) VALUES 
(1, 1500.00, 150.00, 'completed');

-- รอการชำระเงิน (Case: Pending Payment)
INSERT INTO `Payment` (app_id, amount, platform_fee, status) VALUES 
(2, 2000.00, 200.00, 'pending'); 

INSERT INTO `Review` (app_id, rating, comment) VALUES 
(1, 5, 'ครูมานีสอนสนุกมากครับ เข้าใจง่าย');