-- ============================================================
-- seed.sql — ข้อมูลตัวอย่างสำหรับ tutor_match
-- รหัสผ่านทุก account คือ: 1234
-- bcrypt hash ของ '1234' (rounds=12)
-- ============================================================
-- Scenarios ที่ครอบคลุม:
--   A) post closed, teaching completed, payment completed, review
--   B) post open, applications pending (หลายคน)
--   C) post closed, accepted + not_started, escrow paid (รอติวเตอร์เริ่มสอน)
--   D) post closed, accepted + ongoing (กำลังสอนอยู่)
--   E) post closed, accepted + completed, payment pending (รอนักเรียน confirm)
--   F) tutor pending verification (ยังรอ admin)
--   G) tutor rejected
--   H) user banned / suspended
-- ============================================================

USE tutor_match;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. users (20 accounts)
-- ============================================================
INSERT INTO users (user_id, name, email, password_hash, role, account_status) VALUES
-- Admin
(1,  'superuser',       'admin@tutormatch.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'admin',   'active'),
-- Students
(2,  'สมชาย ใจดี',       'somchai@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(3,  'สมหญิง รักเรียน',   'somying@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(4,  'มะลิ หวานใจ',      'mali@test.com',           '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(5,  'กล้า นำชัย',        'kla@test.com',            '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(10, 'แบน ถูกระงับ',      'banned@test.com',         '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'ban'),
(11, 'ปราณี ขยันเรียน',   'pranee@test.com',         '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(12, 'ธนภัทร สนใจ',      'tanaphat@test.com',       '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(13, 'ณัฐพล หัดเรียน',    'nuttapol@test.com',       '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(19, 'สุดา ศิลปะ',        'suda@test.com',           '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(20, 'ธีรพงษ์ ถูกระงับ',   'teeerapong@test.com',     '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'suspended'),
-- Tutors
(6,  'มานี มีสุข',        'manee@test.com',          '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(7,  'ชูใจ วิไล',         'choojai@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(8,  'อาร์ท ฟิสิกส์',     'art_tutor@test.com',      '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(9,  'นิด รอพิจารณา',     'nid_tutor@test.com',      '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(14, 'วิภา รักคณิต',      'wipa_tutor@test.com',     '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(15, 'ประสิทธิ์ สอนดี',    'prasit_tutor@test.com',   '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(16, 'จิตรา ภาษา',        'jittra_tutor@test.com',   '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(17, 'ปิ่นทอง เคมี',      'pinthong_tutor@test.com', '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(18, 'ระพี ชีวะ',         'rapee_tutor@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active');

-- ============================================================
-- 2. student_profiles
-- ============================================================
INSERT INTO student_profiles (student_id, user_id, grade_level, school_name, education_level) VALUES
(1,  2,  'ม.4', 'โรงเรียนมัธยมวิทยา',         'มัธยมศึกษาตอนปลาย'),
(2,  3,  'ม.6', 'โรงเรียนสตรีศึกษา',           'มัธยมศึกษาตอนปลาย'),
(3,  4,  'ป.6', 'อนุบาลนานาชาติ',             'ประถมศึกษา'),
(4,  5,  'ม.3', 'สาธิตมหาวิทยาลัย',           'มัธยมศึกษาตอนต้น'),
(5,  10, 'ม.5', 'โรงเรียนมัธยมทั่วไป',        'มัธยมศึกษาตอนปลาย'),
(6,  11, 'ม.5', 'โรงเรียนนานาชาติกรุงเทพ',    'มัธยมศึกษาตอนปลาย'),
(7,  12, 'ม.6', 'โรงเรียนเตรียมอุดมศึกษา',    'มัธยมศึกษาตอนปลาย'),
(8,  13, 'ม.2', 'โรงเรียนสาธิตประสานมิตร',    'มัธยมศึกษาตอนต้น'),
(9,  19, 'ม.1', 'โรงเรียนราชวินิต',           'มัธยมศึกษาตอนต้น'),
(10, 20, 'ม.4', 'โรงเรียนมัธยมสาธารณะ',       'มัธยมศึกษาตอนปลาย');

-- ============================================================
-- 3. tutor_profiles
-- ============================================================
INSERT INTO tutor_profiles (tutor_id, user_id, bio, hourly_rate, verification_status, profile_picture_url, verified_by, verified_at, reject_reason) VALUES
(1, 6,  'สอนคณิตศาสตร์ประสบการณ์ 5 ปี เน้นเทคนิคลัด ติวสอบ PAT1 ผ่านทุกคน',        300.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-10 10:00:00', NULL),
(2, 7,  'สอนภาษาอังกฤษสไตล์เจ้าของภาษา เน้น speaking และ writing เพื่อสอบ IELTS',   400.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-12 14:00:00', NULL),
(3, 8,  'ติวเตอร์ฟิสิกส์และเคมี จบวิศวะจุฬา เน้นทำโจทย์ยากสอบ PAT2 และ A-Level',   500.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-15 09:30:00', NULL),
(4, 9,  'สอนคณิตศาสตร์ทุกระดับ ยังรอการยืนยันจากแอดมิน',                            350.00, 'pending',  'static/uploads/default_profile.jpg', NULL, NULL,                  NULL),
(5, 14, 'สอนคณิตศาสตร์และแคลคูลัส ปริญญาโทคณิตศาสตร์ มธ. ประสบการณ์ 7 ปี',        450.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-20 11:00:00', NULL),
(6, 15, 'ครูภาษาไทยและสังคมศึกษา ประจำโรงเรียนมัธยม ประสบการณ์ 8 ปี',               280.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-22 13:30:00', NULL),
(7, 16, 'สอนภาษาอังกฤษและภาษาจีน ใบรับรอง HSK Level 5 และ CELTA',                   420.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-01-25 09:00:00', NULL),
(8, 17, 'สอนเคมีระดับมัธยม เอกสารที่ส่งมาไม่ครบตามที่กำหนด',                        320.00, 'rejected', 'static/uploads/default_profile.jpg', 1,    '2026-01-28 14:00:00', 'เอกสารยืนยันคุณวุฒิไม่ครบถ้วน กรุณาส่งใหม่'),
(9, 18, 'สอนชีววิทยาและวิทยาศาสตร์ทั่วไป จบชีววิทยา มเกษตร เน้นเข้าใจแบบ visual',  380.00, 'verified', 'static/uploads/default_profile.jpg', 1,    '2026-02-01 10:00:00', NULL);

-- ============================================================
-- 4. tutor_experiences
-- ============================================================
INSERT INTO tutor_experiences (tutor_id, experience_detail) VALUES
(1, 'ปริญญาตรี วิทยาศาสตร์ (คณิตศาสตร์) มหาวิทยาลัยมหิดล เกียรตินิยม'),
(1, 'สอนพิเศษส่วนตัว 5 ปี นักเรียนผ่าน PAT1 ทุกคน'),
(2, 'ปริญญาตรี ภาษาอังกฤษ มหาวิทยาลัยธรรมศาสตร์'),
(2, 'ใบรับรอง CELTA (Cambridge English Language Teaching to Adults)'),
(2, 'ประสบการณ์สอนสถาบันภาษา 3 ปี'),
(3, 'ปริญญาตรี วิศวกรรมศาสตร์ ฟิสิกส์ประยุกต์ จุฬาลงกรณ์มหาวิทยาลัย'),
(3, 'สอนพิเศษฟิสิกส์-เคมีมา 4 ปี ผลสอบ A-Level เฉลี่ย 85%'),
(5, 'ปริญญาโท คณิตศาสตร์ มหาวิทยาลัยธรรมศาสตร์'),
(5, 'ผู้ช่วยสอนระดับมหาวิทยาลัย 2 ปี'),
(6, 'ปริญญาตรีการศึกษา เอกภาษาไทย มหาวิทยาลัยศรีนครินทรวิโรฒ'),
(6, 'ครูประจำการโรงเรียนมัธยม 8 ปี ใบประกอบวิชาชีพครู'),
(7, 'ปริญญาตรี ภาษาจีน มหาวิทยาลัยหัวเฉียว'),
(7, 'ใบรับรอง HSK Level 5 (ระดับสูง)'),
(7, 'ใบรับรอง CELTA สอนภาษาอังกฤษ'),
(9, 'ปริญญาตรี ชีววิทยา มหาวิทยาลัยเกษตรศาสตร์'),
(9, 'นักศึกษาปริญญาโท ชีวเคมี กำลังศึกษาอยู่');

-- ============================================================
-- 5. tutor_subjects
-- ============================================================
INSERT INTO tutor_subjects (tutor_id, subject) VALUES
(1, 'คณิตศาสตร์'),
(1, 'สถิติ'),
(2, 'ภาษาอังกฤษ'),
(2, 'สนทนาภาษาอังกฤษ'),
(2, 'IELTS/TOEIC'),
(3, 'ฟิสิกส์'),
(3, 'เคมี'),
(4, 'คณิตศาสตร์'),
(5, 'คณิตศาสตร์'),
(5, 'แคลคูลัส'),
(5, 'คณิตศาสตร์ประยุกต์'),
(6, 'ภาษาไทย'),
(6, 'สังคมศึกษา'),
(6, 'ประวัติศาสตร์'),
(7, 'ภาษาอังกฤษ'),
(7, 'ภาษาจีน'),
(8, 'เคมี'),
(9, 'ชีววิทยา'),
(9, 'วิทยาศาสตร์');

-- ============================================================
-- 6. student_posts
-- ============================================================
INSERT INTO student_posts (post_id, student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status) VALUES
-- Scenario A: closed, completed, paid, reviewed
(1,  1, 'คณิตศาสตร์',  'ม.4', 'online',  'ออนไลน์',           'จันทร์-พุธ 17:00-19:00',     'ต้องการปูพื้นฐานสมการ ฟังก์ชัน เตรียมสอบกลางภาค',         1500.00, 'closed'),
-- Scenario B: open, multiple pending apps
(2,  2, 'ภาษาอังกฤษ',  'ม.6', 'both',    'กรุงเทพฯ สยาม',     'เสาร์-อาทิตย์ 10:00-12:00',  'ติวสอบเข้ามหาลัย ONET ด้าน reading + writing',          2000.00, 'open'),
(3,  3, 'คณิตศาสตร์',  'ป.6', 'onsite',  'นนทบุรี',            'เสาร์เช้า 09:00-11:00',       'เตรียมสอบเข้า ม.1 โรงเรียนชั้นนำ',                        800.00,  'open'),
(4,  4, 'ชีววิทยา',    'ม.3', 'online',  'ออนไลน์',           'จันทร์ พุธ 18:00-20:00',      'ติวสอบกลางภาคด่วนมาก ต้องการความเข้าใจเรื่องเซลล์และพันธุกรรม', 900.00, 'open'),
(5,  1, 'เคมี',       'ม.4', 'online',  'ออนไลน์',           'ศุกร์ 17:00-19:00',           'สอนออนไลน์เท่านั้น เน้นโจทย์ปรนัย ธาตุและสารประกอบ',       600.00,  'open'),
-- Scenario C: closed, accepted, not_started, escrow paid
(6,  6, 'ภาษาจีน',     'ม.5', 'online',  'ออนไลน์',           'อังคาร พฤหัส 19:00-21:00',   'เรียน HSK 3 ต้องการปูพื้นฐาน grammar และ vocabulary',      1800.00, 'closed'),
-- Scenario A: another closed, completed, paid, reviewed
(7,  7, 'ชีววิทยา',    'ม.6', 'online',  'ออนไลน์',           'จันทร์-พุธ 18:00-20:00',     'ติว A-Level ชีววิทยา ต้องการเข้าใจกลไกการทำงานของสิ่งมีชีวิต', 2000.00, 'closed'),
-- Scenario E: closed, accepted, completed, payment pending (waiting confirm)
(8,  2, 'ฟิสิกส์',     'ม.6', 'online',  'ออนไลน์',           'พฤหัส 17:00-19:00',          'ติวฟิสิกส์ A-Level กลศาสตร์ ไฟฟ้า คลื่น',                   1500.00, 'closed'),
-- Scenario B: open
(9,  8, 'คณิตศาสตร์',  'ม.2', 'onsite',  'ลาดพร้าว กรุงเทพฯ',   'เสาร์ 13:00-15:00',          'ปูพื้นฐานเลขคณิต พีชคณิต สำหรับสอบปลายภาค',               600.00,  'open'),
(10, 3, 'ภาษาอังกฤษ',  'ป.6', 'both',    'นนทบุรี',            'อาทิตย์ 10:00-12:00',        'เรียน grammar พื้นฐาน และฝึก reading comprehension',        500.00,  'open'),
-- Scenario D: closed, accepted, ongoing
(11, 1, 'ฟิสิกส์',     'ม.4', 'online',  'ออนไลน์',           'อังคาร พฤหัส 18:00-20:00',   'ติวฟิสิกส์พื้นฐาน กลศาสตร์ เตรียมสอบปลายภาค',              1200.00, 'closed'),
-- Scenario B: open
(12, 9, 'ศิลปะ',      'ม.1', 'onsite',  'ปทุมธานี',           'เสาร์บ่าย 13:00-15:00',      'วาดรูปพื้นฐาน สี และองค์ประกอบศิลป์',                       400.00,  'open'),
(13, 6, 'คณิตศาสตร์',  'ม.5', 'online',  'ออนไลน์',           'พุธ ศุกร์ 20:00-22:00',      'ต้องการเสริมทักษะ แคลคูลัสและลำดับอนุกรม เพื่อสอบ SAT',     900.00,  'open'),
-- Scenario A: another closed, completed, paid, reviewed
(14, 7, 'ภาษาอังกฤษ',  'ม.6', 'online',  'ออนไลน์',           'อาทิตย์ 09:00-11:00',        'ติว IELTS เป้าหมาย band 6.5 ขึ้นไป ก่อนสมัครมหาวิทยาลัย',    2500.00, 'closed'),
(15, 4, 'ภาษาไทย',    'ม.3', 'onsite',  'รามคำแหง กรุงเทพฯ',   'จันทร์ พุธ 17:00-18:30',    'ติวไวยากรณ์ภาษาไทย การอ่านจับใจความ เตรียมสอบ O-NET',       700.00,  'open');

-- ============================================================
-- 7. applications
-- ============================================================
INSERT INTO applications (app_id, post_id, tutor_id, status, applied_at, teaching_status) VALUES
-- Scenario A: completed flow
(1,  1,  1, 'accepted', '2026-02-01 09:00:00', 'completed'),   -- สมชาย + มานี: สอนเสร็จแล้ว
-- Scenario B: pending apps
(2,  2,  2, 'pending',  '2026-02-03 10:30:00', 'not_started'), -- ชูใจสมัครสอนสมหญิง
(3,  3,  2, 'rejected', '2026-02-05 11:00:00', 'not_started'), -- ชูใจถูกปฏิเสธ
(4,  3,  1, 'pending',  '2026-02-06 08:00:00', 'not_started'), -- มานีสมัครใหม่
(5,  5,  4, 'pending',  '2026-02-07 14:00:00', 'not_started'), -- นิด (pending tutor) สมัคร
-- Scenario C: accepted, not_started, escrow paid
(6,  6,  7, 'accepted', '2026-02-08 09:00:00', 'not_started'), -- ปราณี + จิตรา: ชำระแล้ว รอเริ่ม
-- Scenario D: ongoing
(7,  11, 3, 'accepted', '2026-02-10 10:00:00', 'ongoing'),     -- สมชาย + อาร์ท: กำลังสอนอยู่
-- Scenario E: completed, waiting confirm
(8,  8,  3, 'accepted', '2026-02-12 11:00:00', 'completed'),   -- สมหญิง + อาร์ท: สอนเสร็จ รอ confirm
-- Scenario A: another completed + paid + reviewed
(9,  7,  9, 'accepted', '2026-02-14 09:30:00', 'completed'),   -- ธนภัทร + ระพี: จบแล้ว
-- Scenario B: multiple apps for same post
(10, 9,  1, 'pending',  '2026-02-15 10:00:00', 'not_started'),
(11, 9,  5, 'pending',  '2026-02-15 14:00:00', 'not_started'),
(12, 2,  7, 'pending',  '2026-02-16 08:30:00', 'not_started'), -- จิตราสมัครด้วย (post 2 มีสองคนสมัคร)
-- Scenario A: 3rd completed flow
(13, 14, 2, 'accepted', '2026-02-17 09:00:00', 'completed'),   -- ธนภัทร + ชูใจ: จบแล้ว
-- Misc
(14, 4,  9, 'pending',  '2026-02-18 10:30:00', 'not_started'),
(15, 10, 2, 'rejected', '2026-02-19 08:00:00', 'not_started'),
(16, 13, 5, 'pending',  '2026-02-20 11:00:00', 'not_started'),
(17, 15, 6, 'pending',  '2026-02-21 09:30:00', 'not_started'),
(18, 12, 5, 'pending',  '2026-02-22 14:00:00', 'not_started');

-- ============================================================
-- 8. tutor_schedules
-- ============================================================
INSERT INTO tutor_schedules (schedule_id, tutor_id, day_of_week, start_time, end_time) VALUES
(1,  1, 'Mon', '17:00:00', '19:00:00'),
(2,  1, 'Wed', '17:00:00', '19:00:00'),
(3,  1, 'Fri', '17:00:00', '19:00:00'),
(4,  2, 'Sat', '09:00:00', '12:00:00'),
(5,  2, 'Sun', '09:00:00', '12:00:00'),
(6,  3, 'Tue', '16:00:00', '20:00:00'),
(7,  3, 'Thu', '16:00:00', '20:00:00'),
(8,  5, 'Mon', '09:00:00', '11:00:00'),
(9,  5, 'Sat', '13:00:00', '15:00:00'),
(10, 6, 'Wed', '18:00:00', '20:00:00'),
(11, 6, 'Fri', '18:00:00', '20:00:00'),
(12, 7, 'Tue', '19:00:00', '21:00:00'),
(13, 7, 'Thu', '19:00:00', '21:00:00'),
(14, 9, 'Mon', '09:00:00', '11:00:00'),
(15, 9, 'Fri', '14:00:00', '16:00:00');

-- ============================================================
-- 9. schedule_bookings
-- ============================================================
INSERT INTO schedule_bookings (booking_id, schedule_id, app_id) VALUES
(1, 1,  1),  -- มานี Mon → app 1 (สมชาย คณิต)
(2, 2,  1),  -- มานี Wed → app 1
(3, 12, 6),  -- จิตรา Tue → app 6 (ปราณี จีน)
(4, 13, 6),  -- จิตรา Thu → app 6
(5, 6,  7),  -- อาร์ท Tue → app 7 (สมชาย ฟิสิกส์)
(6, 7,  8),  -- อาร์ท Thu → app 8 (สมหญิง ฟิสิกส์)
(7, 14, 9),  -- ระพี Mon → app 9 (ธนภัทร ชีวะ)
(8, 4,  13); -- ชูใจ Sat → app 13 (ธนภัทร อังกฤษ)

-- ============================================================
-- 10. payments (platform_fee = ROUND(amount * 0.10, 2))
-- ============================================================
INSERT INTO payments (payment_id, app_id, amount, platform_fee, status) VALUES
(1, 1,  1500.00, 150.00, 'completed'), -- Scenario A: สมชาย-มานี จบสมบูรณ์
(2, 6,  1800.00, 180.00, 'pending'),   -- Scenario C: ปราณี-จิตรา escrow paid, รอเริ่มสอน
(3, 7,  1200.00, 120.00, 'pending'),   -- Scenario D: สมชาย-อาร์ท กำลังสอนอยู่ (escrow held)
(4, 8,  1500.00, 150.00, 'pending'),   -- Scenario E: สมหญิง-อาร์ท สอนเสร็จแล้ว รอ confirm
(5, 9,  2000.00, 200.00, 'completed'), -- Scenario A: ธนภัทร-ระพี จบสมบูรณ์
(6, 13, 2500.00, 250.00, 'completed'); -- Scenario A: ธนภัทร-ชูใจ จบสมบูรณ์

-- ============================================================
-- 11. reviews (เขียนได้เฉพาะ teaching_status = 'completed' + payment completed)
-- ============================================================
INSERT INTO reviews (review_id, app_id, rating, comment, created_at) VALUES
(1, 1,  5, 'ครูมานีสอนสนุกมากครับ อธิบายเข้าใจง่าย มีเทคนิคลัดที่ใช้ได้จริงในการสอบ แนะนำมากครับ',                '2026-02-25 20:00:00'),
(2, 9,  4, 'ครูระพีอธิบายชีววิทยาได้ชัดเจนมาก ใช้ภาพประกอบเยอะ เนื้อหาเข้าใจง่ายขึ้น แต่บางทีเนื้อหาเยอะไปนิดนึง', '2026-03-05 19:30:00'),
(3, 13, 5, 'ครูชูใจสอน IELTS เก่งมากเลยครับ เทคนิค reading เพิ่ม band ได้จริง ผลสอบดีขึ้นอย่างเห็นได้ชัด',       '2026-03-10 21:00:00');

-- ============================================================
-- 12. wallets
-- ============================================================
INSERT INTO wallets (wallet_id, user_id, balance, status) VALUES
(1,  1,  600.00,   'active'),  -- admin: รับ platform_fee จาก 3 คอร์ส (150+200+250)
(2,  2,  300.00,   'active'),  -- สมชาย: ฝาก 3000, จ่าย 1500 (คณิต) + 1200 (ฟิสิกส์)
(3,  3,  1000.00,  'active'),  -- สมหญิง: ฝาก 2500, จ่าย 1500 (ฟิสิกส์)
(4,  4,  500.00,   'active'),  -- มะลิ: ฝาก 500 ยังไม่ซื้อคอร์ส
(5,  5,  0.00,     'active'),  -- กล้า: ยังไม่เติมเงิน
(6,  6,  1350.00,  'active'),  -- มานี (tutor): รับ 1350 จาก app 1 (1500 - 10%)
(7,  7,  2250.00,  'active'),  -- ชูใจ (tutor): รับ 2250 จาก app 13 (2500 - 10%)
(8,  8,  0.00,     'active'),  -- อาร์ท: สอนอยู่ ยังไม่รับเงิน
(9,  9,  0.00,     'active'),  -- นิด: pending tutor
(10, 10, 0.00,     'frozen'),  -- แบน: account ถูก ban
(11, 11, 200.00,   'active'),  -- ปราณี: ฝาก 2000, จ่าย 1800 (จีน escrow)
(12, 12, 500.00,   'active'),  -- ธนภัทร: ฝาก 5000, จ่าย 2000 (ชีวะ) + 2500 (อังกฤษ)
(13, 13, 1000.00,  'active'),  -- ณัฐพล: ฝาก 1000 ยังไม่ซื้อคอร์ส
(14, 14, 0.00,     'active'),  -- วิภา (tutor): ยังไม่รับงาน
(15, 15, 0.00,     'active'),  -- ประสิทธิ์ (tutor): ยังไม่รับงาน
(16, 16, 0.00,     'active'),  -- จิตรา (tutor): คลาสยังไม่เริ่ม
(17, 17, 0.00,     'active'),  -- ปิ่นทอง (tutor rejected): ไม่มีรายได้
(18, 18, 1800.00,  'active'),  -- ระพี (tutor): รับ 1800 จาก app 9 (2000 - 10%)
(19, 19, 500.00,   'active'),  -- สุดา: ฝาก 500 ยังไม่ซื้อคอร์ส
(20, 20, 0.00,     'frozen');  -- ธีรพงษ์: suspended

-- ============================================================
-- 13. transaction_logs
-- ============================================================
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES
-- สมชาย (wallet 2)
(2,  'deposit',        3000.00, 3000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(2,  'payment',        1500.00, 1500.00, 'application',  1,    'ชำระค่าเรียนคณิตศาสตร์ ม.4 (Escrow)'),
(2,  'payment',        1200.00, 300.00,  'application',  7,    'ชำระค่าเรียนฟิสิกส์ ม.4 (Escrow)'),
-- สมหญิง (wallet 3)
(3,  'deposit',        2500.00, 2500.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(3,  'payment',        1500.00, 1000.00, 'application',  8,    'ชำระค่าเรียนฟิสิกส์ ม.6 (Escrow)'),
-- มะลิ (wallet 4)
(4,  'deposit',        500.00,  500.00,  'deposit_slip', NULL, 'เติมเงิน Wallet'),
-- มานี tutor (wallet 6)
(6,  'tutor_earnings', 1350.00, 1350.00, 'application',  1,    'รายได้จากการสอนคณิตศาสตร์ (หัก GP 10%)'),
-- ชูใจ tutor (wallet 7)
(7,  'tutor_earnings', 2250.00, 2250.00, 'application',  13,   'รายได้จากการสอนภาษาอังกฤษ IELTS (หัก GP 10%)'),
-- ปราณี (wallet 11)
(11, 'deposit',        2000.00, 2000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(11, 'payment',        1800.00, 200.00,  'application',  6,    'ชำระค่าเรียนภาษาจีน ม.5 (Escrow)'),
-- ธนภัทร (wallet 12)
(12, 'deposit',        5000.00, 5000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(12, 'payment',        2000.00, 3000.00, 'application',  9,    'ชำระค่าเรียนชีววิทยา ม.6 (Escrow)'),
(12, 'payment',        2500.00, 500.00,  'application',  13,   'ชำระค่าเรียนภาษาอังกฤษ IELTS (Escrow)'),
-- ระพี tutor (wallet 18)
(18, 'tutor_earnings', 1800.00, 1800.00, 'application',  9,    'รายได้จากการสอนชีววิทยา (หัก GP 10%)'),
-- ณัฐพล (wallet 13)
(13, 'deposit',        1000.00, 1000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
-- สุดา (wallet 19)
(19, 'deposit',        500.00,  500.00,  'deposit_slip', NULL, 'เติมเงิน Wallet'),
-- admin platform fees (wallet 1)
(1,  'platform_fee',   150.00,  150.00,  'application',  1,    'ค่าธรรมเนียมแพลตฟอร์ม 10% คณิตศาสตร์'),
(1,  'platform_fee',   200.00,  350.00,  'application',  9,    'ค่าธรรมเนียมแพลตฟอร์ม 10% ชีววิทยา'),
(1,  'platform_fee',   250.00,  600.00,  'application',  13,   'ค่าธรรมเนียมแพลตฟอร์ม 10% ภาษาอังกฤษ IELTS');

-- ============================================================
-- 14. user_bank_accounts
-- ============================================================
INSERT INTO user_bank_accounts (user_id, bank_name, account_number, account_name, is_primary) VALUES
(6,  'ธนาคารกสิกรไทย',      '1234567890', 'มานี มีสุข',          TRUE),
(7,  'ธนาคารกรุงไทย',       '0987654321', 'ชูใจ วิไล',            TRUE),
(8,  'ธนาคารไทยพาณิชย์',    '1122334455', 'อาร์ท ฟิสิกส์',        TRUE),
(9,  'ธนาคารกสิกรไทย',      '9988776655', 'นิด รอพิจารณา',        TRUE),
(2,  'ธนาคารกรุงเทพ',       '5566778899', 'สมชาย ใจดี',           TRUE),
(14, 'ธนาคารกรุงศรีอยุธยา', '3344556677', 'วิภา รักคณิต',         TRUE),
(18, 'ธนาคารไทยพาณิชย์',    '6677889900', 'ระพี ชีวะ',            TRUE);

-- ============================================================
-- 15. reports
-- ============================================================
INSERT INTO reports (reporter_id, target_type, target_id, title, description, status) VALUES
(3,  'user', 9,  'ติวเตอร์แอบอ้างคุณสมบัติ',          'ติวเตอร์รายนี้อ้างว่ามีวุฒิการศึกษาระดับปริญญา แต่เมื่อถามรายละเอียดกลับตอบไม่ได้',            'pending'),
(2,  'post', 4,  'โพสต์ระบุข้อมูลส่วนตัวไม่เหมาะสม',   'โพสต์มีการระบุที่อยู่จริงและเบอร์โทรศัพท์ส่วนตัวที่ไม่ควรเผยแพร่ในระบบ',                    'resolved'),
(11, 'user', 17, 'ติวเตอร์ส่งข้อความไม่เหมาะสม',      'ติวเตอร์ปิ่นทองส่งข้อความที่ไม่เกี่ยวข้องกับการเรียนผ่านระบบ แนะนำให้ตรวจสอบ',               'investigating'),
(5,  'post', 5,  'โพสต์ราคาไม่ตรงตามที่ตกลง',          'ราคาในโพสต์ไม่ตรงกับที่ติวเตอร์แจ้งไว้ในระหว่างเจรจา ขอให้ admin ตรวจสอบ',                  'pending'),
(12, 'user', 8,  'ติวเตอร์ยกเลิกคลาสกะทันหัน',        'ติวเตอร์อาร์ทยกเลิกนัดสอนโดยไม่แจ้งล่วงหน้า เกิดขึ้น 2 ครั้ง ทำให้เสียเวลาและแผนการเรียน',  'pending');

-- ============================================================
-- 16. user_action_logs
-- ============================================================
INSERT INTO user_action_logs (user_id, action_type, target_type, target_id, reason, performed_by) VALUES
(6,  'tutor_verified',    'tutor_profile', 1,  'เอกสารครบถ้วน วุฒิการศึกษาตรงตามที่ระบุ',                                  1),
(7,  'tutor_verified',    'tutor_profile', 2,  'เอกสารครบถ้วน ใบรับรอง CELTA ถูกต้อง',                                      1),
(8,  'tutor_verified',    'tutor_profile', 3,  'เอกสารครบถ้วน ผ่านการตรวจสอบ',                                              1),
(14, 'tutor_verified',    'tutor_profile', 5,  'วุฒิปริญญาโทคณิตศาสตร์ ยืนยันแล้ว',                                        1),
(15, 'tutor_verified',    'tutor_profile', 6,  'ใบประกอบวิชาชีพครูถูกต้อง ผ่านการตรวจสอบ',                                  1),
(16, 'tutor_verified',    'tutor_profile', 7,  'ใบรับรอง HSK และ CELTA ถูกต้อง',                                             1),
(17, 'tutor_rejected',    'tutor_profile', 8,  'เอกสารยืนยันคุณวุฒิไม่ครบถ้วน ขอให้ส่งใบปริญญาและใบประกอบวิชาชีพใหม่',     1),
(18, 'tutor_verified',    'tutor_profile', 9,  'วุฒิปริญญาตรีชีววิทยา ยืนยันแล้ว',                                         1),
(10, 'account_banned',    'user',          10, 'ละเมิดข้อกำหนดการใช้งานซ้ำหลายครั้ง ส่งข้อความ spam ถึงติวเตอร์',          1),
(20, 'account_suspended', 'user',          20, 'รายงานพฤติกรรมไม่เหมาะสมในระบบแชท พักบัญชีชั่วคราวระหว่างตรวจสอบ',        1);

-- ------------------------------------------------------------
-- FLOW 1: จบงานและแบ่งรายได้ (Completed & Split Earnings)
-- ตรรกะ: ติวเตอร์ได้ 90%, แพลตฟอร์มหัก 10%
-- ------------------------------------------------------------
-- 1.1 คอร์สวิทย์พื้นฐาน: 1000 บาท (Tutor 900, Admin 100)
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (19, 1000.00, 100.00, 'completed');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(18, 'tutor_earnings', 900.00, 2700.00, 'application', 19, 'รายได้จากการสอนวิชาวิทยาศาสตร์ (หัก GP 10%)'), --
(1,  'platform_fee',   100.00, 700.00,  'application', 19, 'ค่าธรรมเนียมแพลตฟอร์ม 10% วิทยาศาสตร์');       --

-- 1.2 คอร์สเปียโน: 2000 บาท (Tutor 1800, Admin 200)
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (20, 2000.00, 200.00, 'completed');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(7, 'tutor_earnings', 1800.00, 4050.00, 'application', 20, 'รายได้จากการสอนเปียโน (หัก GP 10%)'),
(1, 'platform_fee',   200.00,  900.00,  'application', 20, 'ค่าธรรมเนียมแพลตฟอร์ม 10% เปียโน');

-- 1.3 คอร์สเขียนโปรแกรม: 5000 บาท (Tutor 4500, Admin 500)
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (21, 5000.00, 500.00, 'completed');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(6, 'tutor_earnings', 4500.00, 5850.00, 'application', 21, 'รายได้จากการสอน Python (หัก GP 10%)'),
(1, 'platform_fee',   500.00,  1400.00, 'application', 21, 'ค่าธรรมเนียมแพลตฟอร์ม 10% Python');

-- 1.4 คอร์สวาดรูป: 800 บาท (Tutor 720, Admin 80)
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (22, 800.00, 80.00, 'completed');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(15, 'tutor_earnings', 720.00, 720.00,  'application', 22, 'รายได้จากการสอนวาดรูป (หัก GP 10%)'),
(1,  'platform_fee',   80.00,  1480.00, 'application', 22, 'ค่าธรรมเนียมแพลตฟอร์ม 10% วาดรูป');

-- 1.5 คอร์สฟิสิกส์ ม.ปลาย: 1500 บาท (Tutor 1350, Admin 150)
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (23, 1500.00, 150.00, 'completed');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(8, 'tutor_earnings', 1350.00, 1350.00, 'application', 23, 'รายได้จากการสอนฟิสิกส์ (หัก GP 10%)'),
(1, 'platform_fee',   150.00,  1630.00, 'application', 23, 'ค่าธรรมเนียมแพลตฟอร์ม 10% ฟิสิกส์');

-- ------------------------------------------------------------
-- FLOW 2: การคืนเงินตามสัดส่วน (Prorated Refund)
-- ตรรกะ: สมมติจอง 3 ชม. เรียนจริง 1 ชม. แล้วขอยกเลิก
-- ------------------------------------------------------------
-- 2.1 เรียนไป 1/3 ชม. (ยอดเต็ม 900): ติวเตอร์ได้ 270, แอดมิน 30, คืนนักเรียน 600
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(2, 'refund',         600.00, 900.00,  'application', 24, 'รับเงินคืนจากคอร์สคณิตศาสตร์ (Prorated)'),      --
(6, 'tutor_earnings', 270.00, 6120.00, 'application', 24, 'รายได้จากการสอนคณิตศาสตร์ 1 ชม. (หัก GP)'),
(1, 'platform_fee',   30.00,  1660.00, 'application', 24, 'ค่าธรรมเนียมแพลตฟอร์ม (สอนจริง 1 ชม.)');

-- 2.2 ยกเลิกก่อนเรียน (Cancel Before Start): คืนเงิน 100% หักค่าธรรมเนียม Gateway 3%
-- ยอด 1000 บาท: คืนนักเรียน 970 บาท
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(3, 'refund', 970.00, 1970.00, 'application', 25, 'รับเงินคืน 100% (หักค่าธรรมเนียม Gateway 3%)');

-- 2.3-2.5 เพิ่ม Transaction Refund กรณีอื่นๆ
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(11, 'refund', 450.00,  650.00,  'application', 26, 'คืนเงินส่วนต่างคอร์สภาษาจีน'),
(12, 'refund', 1200.00, 1700.00, 'application', 27, 'รับเงินคืนเนื่องจากติวเตอร์ยกเลิกคลาส'),
(19, 'refund', 300.00,  800.00,  'application', 28, 'คืนเงินค่าเรียน (Prorated) ตามชั่วโมงที่เหลือ');

-- ------------------------------------------------------------
-- FLOW 3: การถอนเงินออกจากระบบ (Withdrawal)
-- ตรรกะ: ทั้งนักเรียนและติวเตอร์สามารถถอนเงินออกจาก Wallet ได้
-- ------------------------------------------------------------
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(6,  'withdrawal', 1000.00, 5120.00, 'withdrawal_request', 101, 'ถอนเงินออกจาก Wallet ไปยังบัญชีธนาคาร'), --
(7,  'withdrawal', 2000.00, 2050.00, 'withdrawal_request', 102, 'ถอนรายได้จากการสอน'),
(18, 'withdrawal', 500.00,  2200.00, 'withdrawal_request', 103, 'ถอนเงินคืนเข้าบัญชีหลัก'),
(2,  'withdrawal', 300.00,  600.00,  'withdrawal_request', 104, 'ถอนเงินคงเหลือในระบบ'),
(12, 'withdrawal', 500.00,  1200.00, 'withdrawal_request', 105, 'ถอนเงินเข้าบัญชีธนาคารกสิกรไทย');

-- ------------------------------------------------------------
-- FLOW 4: การชำระเงินมัดจำ (Escrow Payment)
-- ตรรกะ: นักเรียนจ่ายเต็มจำนวน เงินอยู่ในระบบ (Pending) ก่อนเริ่มเรียน
-- ------------------------------------------------------------
-- 4.1 จองคอร์สเคมี: 1200 บาท
INSERT INTO payments (app_id, amount, platform_fee, status) 
VALUES (29, 1200.00, 120.00, 'pending');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(11, 'payment', 1200.00, 0.00, 'application', 29, 'ชำระค่าเรียนวิชาเคมี (Escrow Hold)'); --

-- 4.2-4.5 รายการ Escrow อื่นๆ
INSERT INTO payments (app_id, amount, platform_fee, status) VALUES 
(30, 900.00,  90.00,  'pending'), 
(31, 600.00,  60.00,  'pending'), 
(32, 1500.00, 150.00, 'pending'), 
(33, 400.00,  40.00,  'pending');

INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES 
(12, 'payment', 900.00,  300.00, 'application', 30, 'ชำระค่าเรียนวิชาสถิติ'),
(13, 'payment', 600.00,  400.00, 'application', 31, 'ชำระค่าเรียนวิชาภาษาไทย'),
(19, 'payment', 400.00,  400.00, 'application', 32, 'ชำระค่าเรียนวาดภาพเบื้องต้น'),
(4,  'payment', 500.00,  0.00,   'application', 33, 'ชำระค่าเรียนเตรียมสอบ ม.1');

-- ------------------------------------------------------------
-- FLOW 5: การจัดการโดยแอดมิน (Admin & Audit)
-- ตรรกะ: อายัดกระเป๋าเงินกรณีทุจริต หรือตรวจสอบระบบ 
-- ------------------------------------------------------------
-- 5.1 อายัดกระเป๋าเงินผู้ใช้ ID 13 (ณัฐพล) เนื่องจากต้องสงสัยโกงเงิน
UPDATE wallets SET status = 'frozen' WHERE wallet_id = 13; --

INSERT INTO user_action_logs (user_id, action_type, target_type, target_id, reason, performed_by) VALUES 
(13, 'wallet_frozen', 'user', 13, 'พบธุรกรรมต้องสงสัย การเติมเงินไม่ตรงกับสลิป', 1); --

-- 5.2-5.5 บันทึก Audit Log อื่นๆ
INSERT INTO user_action_logs (user_id, action_type, target_type, target_id, reason, performed_by) VALUES 
(11, 'payment_verified', 'payment',       2, 'ตรวจสอบสลิปการโอนเงินเรียบร้อย',          1),
(14, 'tutor_verified',   'tutor_profile', 5, 'ยืนยันวุฒิการศึกษาเพิ่มเติม',               1),
(6,  'audit_check',      'user',          6, 'สุ่มตรวจความถูกต้องของยอดเงินรายได้',      1),
(1,  'fee_update',       'payment',       1, 'ปรับปรุงยอดค่าธรรมเนียมให้ถูกต้องตามระบบ', 1);

SET FOREIGN_KEY_CHECKS = 1;