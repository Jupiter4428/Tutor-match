-- ============================================================
-- seed.sql — ข้อมูลตัวอย่างสำหรับ tutor_match
-- รหัสผ่านทุก account คือ: 1234
-- ============================================================
-- Scenarios ที่ครอบคลุมครบวงจรตาม Flow:
--
--   A) Full Cycle  : post→apply→accept→pay→start→end→confirm→review
--   B) Open Post   : post เปิด, มีหลายคนสมัครรอ student เลือก
--   C) Escrow Paid : accepted + not_started + ชำระ escrow แล้ว รอ tutor เริ่ม
--   D) Ongoing     : tutor กด start แล้ว กำลังสอนอยู่
--   E) Wait Confirm: tutor กด end แล้ว รอ student confirm
--   F) Pending     : tutor รอ admin verify
--   G) Rejected    : tutor ถูก admin ปฏิเสธ
--   H) Banned/Susp : ผู้ใช้ถูก ban / suspended
--   I) Cancel      : student ยกเลิกหลังจ่าย escrow → คืน 97%, post กลับ open
-- ============================================================

USE tutor_match;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. users  (password ทุก account = "1234")
-- ============================================================
INSERT INTO users (user_id, name, email, password_hash, role, account_status) VALUES
-- Admin
(1,  'Admin ระบบ',        'admin@tutormatch.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'admin',   'active'),
-- Students
(2,  'สมชาย ใจดี',        'somchai@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),   -- A, D
(3,  'สมหญิง รักเรียน',   'somying@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),   -- B, E
(4,  'มะลิ หวานใจ',       'mali@test.com',           '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),   -- I (cancel)
(5,  'ปราณี ขยันเรียน',   'pranee@test.com',         '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),   -- C
(6,  'ธนภัทร สนใจ',       'tanaphat@test.com',       '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),   -- A (review)
(7,  'แบน ถูกระงับ',       'banned@test.com',         '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'ban'),      -- H
(8,  'พัก ถูกระงับชั่วคราว','suspended@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'suspended'),-- H
-- Tutors
(9,  'มานี มีสุข',         'manee@test.com',          '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario A
(10, 'ชูใจ วิไล',          'choojai@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario A, B
(11, 'อาร์ท ฟิสิกส์',      'art_tutor@test.com',      '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario D, E
(12, 'จิตรา ภาษาจีน',      'jittra_tutor@test.com',   '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario C
(13, 'ระพี ชีวะ',           'rapee_tutor@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario A (review)
(14, 'ประสิทธิ์ สอนดี',     'prasit_tutor@test.com',   '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- verified, Scenario I (cancel)
(15, 'นิด รอพิจารณา',      'nid_tutor@test.com',      '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),   -- pending F
(16, 'ปิ่นทอง เคมี',       'pinthong_tutor@test.com', '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active');   -- rejected G

-- ============================================================
-- 2. student_profiles
-- ============================================================
INSERT INTO student_profiles (student_id, user_id, grade_level, school_name, education_level) VALUES
(1, 2, 'ม.4', 'โรงเรียนมัธยมวิทยา',        'มัธยมศึกษาตอนปลาย'),
(2, 3, 'ม.6', 'โรงเรียนสตรีศึกษา',          'มัธยมศึกษาตอนปลาย'),
(3, 4, 'ม.3', 'โรงเรียนสาธิตมหาวิทยาลัย',  'มัธยมศึกษาตอนต้น'),
(4, 5, 'ม.5', 'โรงเรียนนานาชาติกรุงเทพ',   'มัธยมศึกษาตอนปลาย'),
(5, 6, 'ม.6', 'โรงเรียนเตรียมอุดมศึกษา',   'มัธยมศึกษาตอนปลาย'),
(6, 7, 'ม.5', 'โรงเรียนมัธยมทั่วไป',       'มัธยมศึกษาตอนปลาย'),
(7, 8, 'ม.4', 'โรงเรียนมัธยมสาธารณะ',      'มัธยมศึกษาตอนปลาย');

-- ============================================================
-- 3. tutor_profiles
-- ============================================================
INSERT INTO tutor_profiles (tutor_id, user_id, bio, hourly_rate, verification_status, profile_picture_url, verified_by, verified_at, reject_reason) VALUES
-- Verified tutors
(1, 9,  'สอนคณิตศาสตร์ประสบการณ์ 5 ปี เน้นเทคนิคลัด ติวสอบ PAT1 ผ่านทุกคน',         300.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-10 10:00:00', NULL),
(2, 10, 'สอนภาษาอังกฤษสไตล์เจ้าของภาษา เน้น speaking และ writing เพื่อสอบ IELTS',    400.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-12 14:00:00', NULL),
(3, 11, 'ติวเตอร์ฟิสิกส์ จบวิศวะจุฬา เน้นทำโจทย์ยาก PAT2 และ A-Level',              500.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-15 09:30:00', NULL),
(4, 12, 'สอนภาษาจีนและภาษาอังกฤษ ใบรับรอง HSK Level 5 และ CELTA',                    420.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-25 09:00:00', NULL),
(5, 13, 'สอนชีววิทยาและวิทยาศาสตร์ จบชีววิทยา มเกษตร เน้นเข้าใจแบบ visual',         380.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-02-01 10:00:00', NULL),
(6, 14, 'สอนภาษาไทยและสังคมศึกษา ครูประจำการ 8 ปี ใบประกอบวิชาชีพครู',              280.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-22 13:30:00', NULL),
-- Scenario F: pending verification
(7, 15, 'สอนคณิตศาสตร์ทุกระดับ ยังรอการยืนยันจากแอดมิน',                             350.00, 'pending',  'static/uploads/default_profile.jpg', NULL, NULL, NULL),
-- Scenario G: rejected
(8, 16, 'สอนเคมีระดับมัธยม เอกสารที่ส่งมาไม่ครบตามที่กำหนด',                         320.00, 'rejected', 'static/uploads/default_profile.jpg', 1, '2026-01-28 14:00:00', 'เอกสารยืนยันคุณวุฒิไม่ครบถ้วน กรุณาส่งใหม่');

-- ============================================================
-- 4. tutor_experiences
-- ============================================================
INSERT INTO tutor_experiences (tutor_id, experience_detail) VALUES
(1, 'ปริญญาตรี วิทยาศาสตร์ (คณิตศาสตร์) มหาวิทยาลัยมหิดล เกียรตินิยม'),
(1, 'สอนพิเศษส่วนตัว 5 ปี นักเรียนผ่าน PAT1 ทุกคน'),
(2, 'ปริญญาตรี ภาษาอังกฤษ มหาวิทยาลัยธรรมศาสตร์'),
(2, 'ใบรับรอง CELTA (Cambridge English Language Teaching to Adults)'),
(3, 'ปริญญาตรี วิศวกรรมศาสตร์ ฟิสิกส์ประยุกต์ จุฬาลงกรณ์มหาวิทยาลัย'),
(3, 'สอนพิเศษฟิสิกส์มา 4 ปี ผลสอบ A-Level เฉลี่ย 85%'),
(4, 'ปริญญาตรี ภาษาจีน มหาวิทยาลัยหัวเฉียว'),
(4, 'ใบรับรอง HSK Level 5 และ CELTA'),
(5, 'ปริญญาตรี ชีววิทยา มหาวิทยาลัยเกษตรศาสตร์'),
(5, 'นักศึกษาปริญญาโท ชีวเคมี กำลังศึกษาอยู่'),
(6, 'ปริญญาตรีการศึกษา เอกภาษาไทย มหาวิทยาลัยศรีนครินทรวิโรฒ'),
(6, 'ครูประจำการโรงเรียนมัธยม 8 ปี ใบประกอบวิชาชีพครู');

-- ============================================================
-- 5. tutor_subjects
-- ============================================================
INSERT INTO tutor_subjects (tutor_id, subject) VALUES
(1, 'คณิตศาสตร์'),
(1, 'สถิติ'),
(2, 'ภาษาอังกฤษ'),
(2, 'IELTS/TOEIC'),
(3, 'ฟิสิกส์'),
(3, 'เคมี'),
(4, 'ภาษาจีน'),
(4, 'ภาษาอังกฤษ'),
(5, 'ชีววิทยา'),
(5, 'วิทยาศาสตร์'),
(6, 'ภาษาไทย'),
(6, 'สังคมศึกษา'),
(7, 'คณิตศาสตร์'),
(8, 'เคมี');

-- ============================================================
-- 6. student_posts
-- ============================================================
INSERT INTO student_posts (post_id, student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status) VALUES
-- Scenario A: สมชาย → จ้างมานี สอนคณิต (จบแล้ว + รีวิว)
(1, 1, 'คณิตศาสตร์', 'ม.4', 'online',  'ออนไลน์',           'จันทร์-พุธ 17:00-19:00',    'ปูพื้นฐานสมการ ฟังก์ชัน เตรียมสอบกลางภาค',              1500.00, 'closed'),
-- Scenario A: ธนภัทร → จ้างระพี สอนชีวะ (จบแล้ว + รีวิว)
(2, 5, 'ชีววิทยา',   'ม.6', 'online',  'ออนไลน์',           'จันทร์-พุธ 18:00-20:00',    'ติว A-Level ชีววิทยา กลไกการทำงานของสิ่งมีชีวิต',        2000.00, 'closed'),
-- Scenario B: สมหญิง → เปิดโพสต์ภาษาอังกฤษ (open, มีหลายคนสมัคร)
(3, 2, 'ภาษาอังกฤษ', 'ม.6', 'both',    'กรุงเทพฯ สยาม',     'เสาร์-อาทิตย์ 10:00-12:00', 'ติวสอบเข้ามหาลัย ONET ด้าน reading + writing',           2000.00, 'open'),
-- Scenario C: ปราณี → จ้างจิตรา สอนจีน (escrow paid, รอ tutor เริ่ม)
(4, 4, 'ภาษาจีน',    'ม.5', 'online',  'ออนไลน์',           'อังคาร พฤหัส 19:00-21:00',  'เรียน HSK 3 ปูพื้นฐาน grammar และ vocabulary',            1800.00, 'closed'),
-- Scenario D: สมชาย → จ้างอาร์ท สอนฟิสิกส์ (กำลังสอนอยู่)
(5, 1, 'ฟิสิกส์',    'ม.4', 'online',  'ออนไลน์',           'อังคาร พฤหัส 18:00-20:00',  'ติวฟิสิกส์พื้นฐาน กลศาสตร์ เตรียมสอบปลายภาค',           1200.00, 'closed'),
-- Scenario E: สมหญิง → จ้างอาร์ท สอนฟิสิกส์ (tutor จบแล้ว รอ confirm)
(6, 2, 'ฟิสิกส์',    'ม.6', 'online',  'ออนไลน์',           'พฤหัส 17:00-19:00',         'ติวฟิสิกส์ A-Level กลศาสตร์ ไฟฟ้า คลื่น',                1500.00, 'closed'),
-- Scenario B: สมหญิง → เปิดอีกโพสต์ (open, รอคนสมัคร)
(7, 2, 'คณิตศาสตร์', 'ม.6', 'onsite',  'ลาดพร้าว กรุงเทพฯ', 'เสาร์ 13:00-15:00',         'ปูพื้นฐานแคลคูลัส เตรียมสอบเข้ามหาลัย',                 900.00,  'open'),
-- Scenario I: มะลิ → จ้างประสิทธิ์ สอนภาษาไทย แต่ยกเลิก (post กลับ open)
(8, 3, 'ภาษาไทย',    'ม.3', 'onsite',  'รามคำแหง กรุงเทพฯ', 'จันทร์ พุธ 17:00-18:30',    'ติวไวยากรณ์ภาษาไทย การอ่านจับใจความ เตรียมสอบ O-NET',  500.00,  'open');

-- ============================================================
-- 7. applications
-- ============================================================
INSERT INTO applications (app_id, post_id, tutor_id, status, applied_at, teaching_status) VALUES
-- Scenario A: สมชาย + มานี — จบสมบูรณ์ + รีวิว
(1, 1, 1, 'accepted', '2026-02-01 09:00:00', 'completed'),
-- Scenario A: ธนภัทร + ระพี — จบสมบูรณ์ + รีวิว
(2, 2, 5, 'accepted', '2026-02-14 09:30:00', 'completed'),
-- Scenario B: สมหญิง — ชูใจสมัคร (pending)
(3, 3, 2, 'pending',  '2026-02-03 10:30:00', 'not_started'),
-- Scenario B: สมหญิง — จิตราสมัคร (pending)
(4, 3, 4, 'pending',  '2026-02-04 11:00:00', 'not_started'),
-- Scenario B: สมหญิง — มานีสมัคร (pending)
(5, 3, 1, 'pending',  '2026-02-05 08:00:00', 'not_started'),
-- Scenario C: ปราณี + จิตรา — escrow paid, รอเริ่ม
(6, 4, 4, 'accepted', '2026-02-08 09:00:00', 'not_started'),
-- Scenario D: สมชาย + อาร์ท — กำลังสอนอยู่
(7, 5, 3, 'accepted', '2026-02-10 10:00:00', 'ongoing'),
-- Scenario E: สมหญิง + อาร์ท — สอนจบแล้ว รอ confirm
(8, 6, 3, 'accepted', '2026-02-12 11:00:00', 'completed'),
-- Scenario B: สมหญิง post 7 — มานีสมัคร (pending)
(9, 7, 1, 'pending',  '2026-02-15 10:00:00', 'not_started'),
-- Scenario I: มะลิ + ประสิทธิ์ — ยกเลิกหลังจ่าย escrow (rejected, post กลับ open)
(10, 8, 6, 'rejected', '2026-02-16 09:00:00', 'not_started');

-- ============================================================
-- 8. tutor_schedules
-- ============================================================
INSERT INTO tutor_schedules (schedule_id, tutor_id, day_of_week, start_time, end_time) VALUES
(1,  1, 'Mon', '17:00:00', '19:00:00'),
(2,  1, 'Wed', '17:00:00', '19:00:00'),
(3,  2, 'Sat', '09:00:00', '12:00:00'),
(4,  2, 'Sun', '09:00:00', '12:00:00'),
(5,  3, 'Tue', '16:00:00', '20:00:00'),
(6,  3, 'Thu', '16:00:00', '20:00:00'),
(7,  4, 'Tue', '19:00:00', '21:00:00'),
(8,  4, 'Thu', '19:00:00', '21:00:00'),
(9,  5, 'Mon', '09:00:00', '11:00:00'),
(10, 5, 'Fri', '14:00:00', '16:00:00'),
(11, 6, 'Mon', '17:00:00', '18:30:00'),
(12, 6, 'Wed', '17:00:00', '18:30:00');

-- ============================================================
-- 9. schedule_bookings
-- ============================================================
INSERT INTO schedule_bookings (booking_id, schedule_id, app_id) VALUES
(1, 1,  1),   -- มานี Mon  → app 1 (สมชาย คณิต)
(2, 2,  1),   -- มานี Wed  → app 1
(3, 9,  2),   -- ระพี Mon  → app 2 (ธนภัทร ชีวะ)
(4, 7,  6),   -- จิตรา Tue → app 6 (ปราณี จีน)
(5, 8,  6),   -- จิตรา Thu → app 6
(6, 5,  7),   -- อาร์ท Tue → app 7 (สมชาย ฟิสิกส์)
(7, 6,  8);   -- อาร์ท Thu → app 8 (สมหญิง ฟิสิกส์)

-- ============================================================
-- 10. payments  (platform_fee = ROUND(amount * 0.10, 2))
-- ============================================================
INSERT INTO payments (payment_id, app_id, amount, platform_fee, status) VALUES
-- Scenario A: จบและปล่อยเงิน
(1, 1, 1500.00, 150.00, 'completed'),  -- สมชาย + มานี   ✅
(2, 2, 2000.00, 200.00, 'completed'),  -- ธนภัทร + ระพี   ✅
-- Scenario C: escrow hold รอ tutor เริ่ม
(3, 6, 1800.00, 180.00, 'pending'),    -- ปราณี + จิตรา
-- Scenario D: escrow hold กำลังสอน
(4, 7, 1200.00, 120.00, 'pending'),    -- สมชาย + อาร์ท
-- Scenario E: escrow hold รอ student confirm
(5, 8, 1500.00, 150.00, 'pending'),    -- สมหญิง + อาร์ท
-- Scenario I: escrow hold ก่อนยกเลิก (payment ไม่ถูกลบ คงเป็น pending)
(6, 10, 500.00, 50.00,  'pending');    -- มะลิ + ประสิทธิ์ (cancelled)

-- ============================================================
-- 11. reviews  (เขียนได้เฉพาะ teaching_status='completed' + payment completed)
-- ============================================================
INSERT INTO reviews (review_id, app_id, rating, comment, created_at) VALUES
(1, 1, 5, 'ครูมานีสอนสนุกมากครับ อธิบายเข้าใจง่าย มีเทคนิคลัดที่ใช้ได้จริงในการสอบ แนะนำมากครับ',                  '2026-02-25 20:00:00'),
(2, 2, 4, 'ครูระพีอธิบายชีววิทยาได้ชัดเจน ใช้ภาพประกอบเยอะ เนื้อหาเข้าใจง่ายขึ้น แต่บางทีเนื้อหาเยอะไปนิดนึง', '2026-03-05 19:30:00');

-- ============================================================
-- 12. wallets  (balance ตรงกับ transaction_logs ด้านล่างทุกบัญชี)
-- ============================================================
INSERT INTO wallets (wallet_id, user_id, balance, status) VALUES
(1,  1,  350.00,  'active'),   -- admin: platform_fee app1(150) + app2(200) = 350
(2,  2,  300.00,  'active'),   -- สมชาย: deposit3000 - pay1500(app1) - pay1200(app7=D) = 300
(3,  3,  485.00,  'active'),   -- มะลิ: deposit500 - pay500(cancel) + refund485 = 485
(4,  4,  200.00,  'active'),   -- ปราณี: deposit2000 - pay1800(app6=C) = 200
(5,  5,  500.00,  'active'),   -- ธนภัทร: deposit2500 - pay2000(app2) = 500
(6,  6,  0.00,    'active'),   -- banned (H)
(7,  7,  0.00,    'frozen'),   -- suspended (H)
(8,  8,  0.00,    'active'),   -- สมหญิง: deposit1500 - pay1500(app8=E) = 0
(9,  9,  1350.00, 'active'),   -- มานี (tutor): tutor_earnings app1 = 1350
(10, 10, 2250.00, 'active'),   -- ชูใจ (tutor): ยังไม่มีงาน (wallet สำรอง)
(11, 11, 0.00,    'active'),   -- อาร์ท (tutor): สอนอยู่ ยังไม่รับเงิน
(12, 12, 0.00,    'active'),   -- จิตรา (tutor): รอเริ่มสอน ยังไม่รับเงิน
(13, 13, 1800.00, 'active'),   -- ระพี (tutor): tutor_earnings app2 = 1800
(14, 14, 0.00,    'active'),   -- ประสิทธิ์ (tutor): ไม่ได้รับเงิน (cancelled)
(15, 15, 0.00,    'active'),   -- นิด (pending tutor F)
(16, 16, 0.00,    'active');   -- ปิ่นทอง (rejected tutor G)

-- ============================================================
-- 13. transaction_logs
-- ============================================================
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES
-- === สมชาย (wallet 2) ===
(2, 'deposit',  3000.00, 3000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(2, 'payment',  1500.00, 1500.00, 'application',  1,    'ชำระค่าเรียนคณิตศาสตร์ ม.4 (Escrow)'),    -- Scenario A
(2, 'payment',  1200.00, 300.00,  'application',  7,    'ชำระค่าเรียนฟิสิกส์ ม.4 (Escrow)'),         -- Scenario D

-- === สมหญิง (wallet 8) ===
(8, 'deposit',  1500.00, 1500.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(8, 'payment',  1500.00, 0.00,    'application',  8,    'ชำระค่าเรียนฟิสิกส์ ม.6 (Escrow)'),         -- Scenario E

-- === มะลิ (wallet 3) — Scenario I: cancel ===
(3, 'deposit',  500.00,  500.00,  'deposit_slip', NULL, 'เติมเงิน Wallet'),
(3, 'payment',  500.00,  0.00,    'application',  10,   'ชำระค่าเรียนภาษาไทย (Escrow)'),
(3, 'refund',   485.00,  485.00,  'application',  10,   'คืนเงินยกเลิกคอร์สภาษาไทย (หัก Gateway Fee 3%)'),

-- === ปราณี (wallet 4) — Scenario C ===
(4, 'deposit',  2000.00, 2000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(4, 'payment',  1800.00, 200.00,  'application',  6,    'ชำระค่าเรียนภาษาจีน ม.5 (Escrow)'),

-- === ธนภัทร (wallet 5) — Scenario A ===
(5, 'deposit',  2500.00, 2500.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(5, 'payment',  2000.00, 500.00,  'application',  2,    'ชำระค่าเรียนชีววิทยา ม.6 (Escrow)'),

-- === มานี tutor (wallet 9) — Scenario A ===
(9, 'tutor_earnings', 1350.00, 1350.00, 'application', 1, 'รายได้จากการสอนคณิตศาสตร์ (หัก GP 10%)'),

-- === ระพี tutor (wallet 13) — Scenario A ===
(13, 'tutor_earnings', 1800.00, 1800.00, 'application', 2, 'รายได้จากการสอนชีววิทยา (หัก GP 10%)'),

-- === Admin platform fees (wallet 1) ===
(1, 'platform_fee', 150.00, 150.00, 'application', 1, 'ค่าธรรมเนียม GP 10% คณิตศาสตร์'),
(1, 'platform_fee', 200.00, 350.00, 'application', 2, 'ค่าธรรมเนียม GP 10% ชีววิทยา');

-- ============================================================
-- 14. user_bank_accounts
-- ============================================================
INSERT INTO user_bank_accounts (user_id, bank_name, account_number, account_name, is_primary) VALUES
(2,  'ธนาคารกรุงเทพ',       '5566778899', 'สมชาย ใจดี',      TRUE),
(9,  'ธนาคารกสิกรไทย',      '1234567890', 'มานี มีสุข',       TRUE),
(10, 'ธนาคารกรุงไทย',       '0987654321', 'ชูใจ วิไล',        TRUE),
(11, 'ธนาคารไทยพาณิชย์',    '1122334455', 'อาร์ท ฟิสิกส์',    TRUE),
(13, 'ธนาคารไทยพาณิชย์',    '6677889900', 'ระพี ชีวะ',        TRUE),
(14, 'ธนาคารกรุงศรีอยุธยา', '3344556677', 'ประสิทธิ์ สอนดี',  TRUE);

-- ============================================================
-- 15. reports
-- ============================================================
INSERT INTO reports (reporter_id, target_type, target_id, title, description, status) VALUES
(3, 'user', 15, 'ติวเตอร์แอบอ้างคุณสมบัติ',     'ติวเตอร์รายนี้อ้างว่ามีวุฒิการศึกษาระดับปริญญา แต่เมื่อถามรายละเอียดกลับตอบไม่ได้',           'pending'),
(2, 'post',  3, 'โพสต์ระบุข้อมูลส่วนตัว',        'โพสต์มีการระบุเบอร์โทรศัพท์ส่วนตัวที่ไม่ควรเผยแพร่',                                         'resolved'),
(4, 'user', 11, 'ติวเตอร์ยกเลิกคลาสกะทันหัน',   'ติวเตอร์ยกเลิกนัดสอนโดยไม่แจ้งล่วงหน้า เกิดขึ้น 2 ครั้ง ทำให้เสียเวลาและแผนการเรียน',      'investigating'),
(5, 'user', 16, 'ติวเตอร์ส่งข้อความไม่เหมาะสม', 'ติวเตอร์ส่งข้อความที่ไม่เกี่ยวกับการเรียนผ่านระบบ แนะนำให้ตรวจสอบ',                          'pending');

-- ============================================================
-- 16. user_action_logs  (audit trail ของ admin)
-- ============================================================
INSERT INTO user_action_logs (user_id, action_type, target_type, target_id, reason, performed_by) VALUES
(9,  'tutor_verified',    'tutor_profile', 1, 'เอกสารครบถ้วน วุฒิการศึกษาตรงตามที่ระบุ',        1),
(10, 'tutor_verified',    'tutor_profile', 2, 'เอกสารครบถ้วน ใบรับรอง CELTA ถูกต้อง',            1),
(11, 'tutor_verified',    'tutor_profile', 3, 'เอกสารครบถ้วน ผ่านการตรวจสอบ',                    1),
(12, 'tutor_verified',    'tutor_profile', 4, 'ใบรับรอง HSK และ CELTA ถูกต้อง',                   1),
(13, 'tutor_verified',    'tutor_profile', 5, 'วุฒิปริญญาตรีชีววิทยา ยืนยันแล้ว',               1),
(14, 'tutor_verified',    'tutor_profile', 6, 'ใบประกอบวิชาชีพครูถูกต้อง ผ่านการตรวจสอบ',        1),
(16, 'tutor_rejected',    'tutor_profile', 8, 'เอกสารยืนยันคุณวุฒิไม่ครบ ขอให้ส่งใหม่',          1),
(7,  'account_banned',    'user',          7, 'ละเมิดข้อกำหนดการใช้งานซ้ำหลายครั้ง',              1),
(8,  'account_suspended', 'user',          8, 'รายงานพฤติกรรมไม่เหมาะสม พักบัญชีระหว่างตรวจสอบ', 1);

SET FOREIGN_KEY_CHECKS = 1;
