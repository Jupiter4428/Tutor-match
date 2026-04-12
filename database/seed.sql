-- สร้าง User 4 คน (นักเรียน 2, ติวเตอร์ 2) 
INSERT INTO `User` (name, email, password_hash) VALUES 
('น้องสมชาย เรียนดี', 'somchai@example.com', 'hashed123'),
('น้องสมหญิง ขยันมาก', 'somying@example.com', 'hashed123'),
('ติวเตอร์มานี เก่งคณิต', 'manee@example.com', 'hashed456'),
('ติวเตอร์ชูใจ ได้ภาษา', 'choojai@example.com', 'hashed456');

-- ผูก Role
INSERT INTO `User_Role` (user_id, role) VALUES 
(1, 'student'), (2, 'student'), (3, 'tutor'), (4, 'tutor');

-- สร้าง Profile
INSERT INTO `Student_Profile` (user_id, grade_level, school_name) VALUES 
(1, 'ม.4', 'โรงเรียนมัธยมวิทยา'),
(2, 'ม.6', 'โรงเรียนสตรีศึกษา');

INSERT INTO `Tutor_Profile` (user_id, bio, verification_status, hourly_rate) VALUES 
(3, 'สอนคณิตศาสตร์ประสบการณ์ 5 ปี', 'verified', 300.00),
(4, 'สอนภาษาอังกฤษ สไตล์ฝรั่ง', 'verified', 400.00);

-- เพิ่มวิชาที่รับสอน (Tutor Subject)
INSERT INTO `Tutor_Subject` (tutor_id, subject) VALUES 
(1, 'คณิตศาสตร์'), (1, 'ฟิสิกส์'),
(2, 'ภาษาอังกฤษ'), (2, 'สนทนาภาษาอังกฤษ');

-- โพสต์หาติวเตอร์ (Posts)
INSERT INTO `Student_Post` (student_id, subject, description, budget) VALUES 
(1, 'คณิตศาสตร์ ม.4', 'ต้องการคนปูพื้นฐาน', 250.00),
(2, 'ภาษาอังกฤษ ม.6', 'ติวสอบเข้ามหาลัยด่วน', 500.00),
(1, 'ฟิสิกส์ ม.4', 'หาคนช่วยทำการบ้าน', 200.00);

-- ติวเตอร์กดสมัครสอน (Applications)
INSERT INTO `Application` (post_id, tutor_id, status) VALUES 
(1, 1, 'accepted'), -- มานี สอน สมชาย (คณิต)
(2, 2, 'accepted'), -- ชูใจ สอน สมหญิง (อังกฤษ)
(3, 1, 'pending');  -- มานี ยื่นสมัคร ฟิสิกส์ สมชาย (รอตอบรับ)

-- การชำระเงิน (Payments) - หัก Platform fee 10%
INSERT INTO `Payment` (app_id, amount, platform_fee, status) VALUES 
(1, 1500.00, 150.00, 'completed'),
(2, 2000.00, 200.00, 'completed');

-- การรีวิว (Reviews)
INSERT INTO `Review` (app_id, rating, comment) VALUES 
(1, 5, 'ครูมานีสอนสนุกมากครับ เข้าใจง่าย'),
(2, 4, 'สอนดีค่ะ แต่แอบให้การบ้านเยอะไปนิด');
