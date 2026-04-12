-- 1. สร้าง User 5 คน (Admin 1, Student 2, Tutor 2)
-- หมายเหตุ: user_id จะรัน 1, 2, 3, 4, 5 ตามลำดับ
INSERT INTO `User` (name, email, password_hash) VALUES 
('แอดมินใจดี', 'admin@tutormatch.com', 'hashed_admin'),    -- ID: 1
('น้องสมชาย', 'somchai@test.com', 'hashed_student'),       -- ID: 2
('น้องสมหญิง', 'somying@test.com', 'hashed_student'),      -- ID: 3
('ติวเตอร์มานี', 'manee@test.com', 'hashed_tutor'),        -- ID: 4
('ติวเตอร์ชูใจ', 'choojai@test.com', 'hashed_tutor');      -- ID: 5

-- 2. ผูก Role ให้ตรงตามโจทย์
INSERT INTO `User_Role` (user_id, role) VALUES 
(1, 'admin'), 
(2, 'student'), (3, 'student'), 
(4, 'tutor'), (5, 'tutor');

-- 3. สร้าง Profile (ID 2,3 เป็น Student / ID 4,5 เป็น Tutor)
INSERT INTO `Student_Profile` (user_id, grade_level, school_name) VALUES 
(2, 'ม.4', 'โรงเรียนมัธยมวิทยา'), -- student_id: 1
(3, 'ม.6', 'โรงเรียนสตรีศึกษา');   -- student_id: 2

INSERT INTO `Tutor_Profile` (user_id, bio, verification_status, hourly_rate) VALUES 
(4, 'สอนคณิตศาสตร์ประสบการณ์ 5 ปี', 'verified', 300.00), -- tutor_id: 1
(5, 'สอนภาษาอังกฤษ สไตล์ฝรั่ง', 'verified', 400.00);      -- tutor_id: 2

-- 4. เพิ่มวิชาที่รับสอน (Tutor Subject) - อ้างอิงจาก tutor_id ในตาราง Profile
INSERT INTO `Tutor_Subject` (tutor_id, subject) VALUES 
(1, 'คณิตศาสตร์'), (1, 'ฟิสิกส์'),
(2, 'ภาษาอังกฤษ'), (2, 'สนทนาภาษาอังกฤษ');

-- 5. โพสต์หาติวเตอร์ (Posts) - อ้างอิงจาก student_id ในตาราง Profile
INSERT INTO `Student_Post` (student_id, subject, description, budget) VALUES 
(1, 'คณิตศาสตร์ ม.4', 'ต้องการคนปูพื้นฐาน', 250.00), -- post_id: 1
(2, 'ภาษาอังกฤษ ม.6', 'ติวสอบเข้ามหาลัยด่วน', 500.00); -- post_id: 2

-- 6. การสมัครสอน (Applications)
INSERT INTO `Application` (post_id, tutor_id, status) VALUES 
(1, 1, 'accepted'), -- ติวเตอร์มานี (1) สมัครงานของ สมชาย (1)
(2, 2, 'pending');  -- ติวเตอร์ชูใจ (2) สมัครงานของ สมหญิง (2) - รอตอบรับ

-- 7. การชำระเงิน (Payments) - อ้างอิงจาก app_id: 1 ที่ accepted แล้ว
INSERT INTO `Payment` (app_id, amount, platform_fee, status) VALUES 
(1, 1500.00, 150.00, 'completed');

-- 8. การรีวิว (Reviews)
INSERT INTO `Review` (app_id, rating, comment) VALUES 
(1, 5, 'ครูมานีสอนสนุกมากครับ');