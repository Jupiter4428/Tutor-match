-- ============================================================
-- seed.sql — ข้อมูลตัวอย่างสำหรับ tutor_match
-- รหัสผ่านทุก account คือ: 1234
-- bcrypt hash ของ '1234' (rounds=12)
-- ============================================================

USE tutor_match;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. users
-- ============================================================
INSERT INTO users (user_id, name, email, password_hash, role, account_status) VALUES
(1,  'superuser',      'admin@tutormatch.com',     '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'admin',   'active'),
(2,  'สมชาย ใจดี',        'somchai@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(3,  'สมหญิง รักเรียน',    'somying@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(4,  'มะลิ หวานใจ',       'mali@test.com',       '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(5,  'กล้า นำชัย',         'kla@test.com',        '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'active'),
(6,  'มานี มีสุข',         'manee@test.com',      '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(7,  'ชูใจ วิไล',          'choojai@test.com',    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(8,  'อาร์ท ฟิสิกส์',      'art_tutor@test.com',  '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(9,  'นิด รอพิจารณา',      'nid_tutor@test.com',  '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'tutor',   'active'),
(10, 'แบน ถูกระงับ',       'banned@test.com',     '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2', 'student', 'ban');

-- ============================================================
-- 2. student_profiles
-- ============================================================
INSERT INTO student_profiles (student_id, user_id, grade_level, school_name, education_level) VALUES
(1, 2,  'ม.4', 'โรงเรียนมัธยมวิทยา',       'มัธยมศึกษาตอนปลาย'),
(2, 3,  'ม.6', 'โรงเรียนสตรีศึกษา',         'มัธยมศึกษาตอนปลาย'),
(3, 4,  'ป.6', 'อนุบาลนานาชาติ',             'ประถมศึกษา'),
(4, 5,  'ม.3', 'สาธิตมหาวิทยาลัย',           'มัธยมศึกษาตอนต้น'),
(5, 10, 'ม.5', 'โรงเรียนมัธยมทั่วไป',        'มัธยมศึกษาตอนปลาย');

-- ============================================================
-- 3. tutor_profiles
-- ============================================================
INSERT INTO tutor_profiles (tutor_id, user_id, bio, hourly_rate, verification_status, profile_picture_url, verified_by, verified_at) VALUES
(1, 6, 'สอนคณิตศาสตร์ประสบการณ์ 5 ปี เน้นเทคนิคลัด', 300.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-10 10:00:00'),
(2, 7, 'สอนภาษาอังกฤษสไตล์เจ้าของภาษา เน้น speaking', 400.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-12 14:00:00'),
(3, 8, 'ติวเตอร์ฟิสิกส์และเคมี เน้นทำโจทย์ยากสอบ PAT', 500.00, 'verified', 'static/uploads/default_profile.jpg', 1, '2026-01-15 09:30:00'),
(4, 9, 'สอนคณิตศาสตร์ทุกระดับ ยังรอการยืนยันจากแอดมิน', 350.00, 'pending',  'static/uploads/default_profile.jpg', NULL, NULL);

-- ============================================================
-- 4. tutor_subjects
-- ============================================================
INSERT INTO tutor_subjects (tutor_id, subject) VALUES
(1, 'คณิตศาสตร์'),
(1, 'ฟิสิกส์'),
(2, 'ภาษาอังกฤษ'),
(2, 'สนทนาภาษาอังกฤษ'),
(3, 'ฟิสิกส์'),
(3, 'เคมี'),
(4, 'คณิตศาสตร์');

-- ============================================================
-- 5. student_posts
-- ============================================================
INSERT INTO student_posts (post_id, student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status) VALUES
(1, 1, 'คณิตศาสตร์', 'ม.4',  'online',  'ออนไลน์',    'จันทร์-พุธ 17:00-19:00', 'ต้องการปูพื้นฐานสมการ ฟังก์ชัน เตรียมสอบกลางภาค', 250.00, 'open'),
(2, 2, 'ภาษาอังกฤษ', 'ม.6',  'both',    'กรุงเทพฯ',   'เสาร์-อาทิตย์ 10:00-12:00', 'ติวสอบเข้ามหาลัย ONET ด้าน reading + writing', 500.00, 'open'),
(3, 3, 'คณิตศาสตร์', 'ป.6',  'onsite',  'นนทบุรี',    'เสาร์เช้า 09:00-11:00', 'เตรียมสอบเข้า ม.1 โรงเรียนชั้นนำ', 350.00, 'open'),
(4, 4, 'ชีววิทยา',    'ม.3',  'online',  'ออนไลน์',    'จันทร์ พุธ 18:00-20:00', 'ติวสอบกลางภาคด่วนมาก', 450.00, 'open'),
(5, 1, 'เคมี',        'ม.4',  'online',  'ออนไลน์',    'ศุกร์ 17:00-19:00', 'สอนออนไลน์เท่านั้น เน้นโจทย์ปรนัย', 300.00, 'open');

-- ============================================================
-- 6. applications
-- ============================================================
INSERT INTO applications (app_id, post_id, tutor_id, status, applied_at, teaching_status) VALUES
(1, 1, 1, 'accepted', '2026-02-01 09:00:00', 'completed'),  -- สมชาย + มานี สอนเสร็จแล้ว
(2, 2, 2, 'pending',  '2026-02-03 10:30:00', 'not_started'), -- รอนักเรียนยืนยัน
(3, 3, 2, 'rejected', '2026-02-05 11:00:00', 'not_started'), -- นักเรียนปฏิเสธ
(4, 3, 1, 'pending',  '2026-02-06 08:00:00', 'not_started'), -- ติวเตอร์ใหม่สมัครแทน
(5, 5, 4, 'pending',  '2026-02-07 14:00:00', 'not_started'); -- ติวเตอร์ pending รอ verify

-- ============================================================
-- 7. tutor_schedules
-- ============================================================
INSERT INTO tutor_schedules (schedule_id, tutor_id, day_of_week, start_time, end_time) VALUES
(1, 1, 'Mon', '17:00:00', '19:00:00'),
(2, 1, 'Wed', '17:00:00', '19:00:00'),
(3, 2, 'Sat', '09:00:00', '12:00:00'),
(4, 2, 'Sun', '09:00:00', '12:00:00'),
(5, 3, 'Tue', '16:00:00', '18:00:00'),
(6, 3, 'Thu', '16:00:00', '18:00:00');

-- ============================================================
-- 8. schedule_bookings
-- ============================================================
INSERT INTO schedule_bookings (booking_id, schedule_id, app_id) VALUES
(1, 1, 1),
(2, 2, 1);

-- ============================================================
-- 9. payments  (platform_fee ต้องเท่ากับ ROUND(amount * 0.10, 2))
-- ============================================================
INSERT INTO payments (payment_id, app_id, amount, platform_fee, status, verified_by, verified_at) VALUES
(1, 1, 1500.00, 150.00, 'completed', 1, '2026-02-20 10:00:00'),
(2, 2, 2000.00, 200.00, 'pending',   NULL, NULL);

-- ============================================================
-- 10. reviews  (เขียนได้เฉพาะ teaching_status = 'completed')
-- ============================================================
INSERT INTO reviews (review_id, app_id, rating, comment) VALUES
(1, 1, 5, 'ครูมานีสอนสนุกมากครับ เข้าใจง่าย แนะนำเทคนิคดีมาก');

-- ============================================================
-- 11. wallets
-- ============================================================
INSERT INTO wallets (wallet_id, user_id, balance, status) VALUES
(1,  1,  150.00,  'active'),   -- admin (รับ platform fee)
(2,  2,  500.00,  'active'),   -- สมชาย (ฝาก 2000 จ่าย 1500)
(3,  3,  1200.00, 'active'),   -- สมหญิง
(4,  4,  300.00,  'active'),   -- มะลิ
(5,  5,  0.00,    'active'),   -- กล้า
(6,  6,  1350.00, 'active'),   -- มานี (รับ 1500 - fee 150)
(7,  7,  0.00,    'active'),   -- ชูใจ
(8,  8,  0.00,    'active'),   -- อาร์ท
(9,  9,  0.00,    'active'),   -- นิด
(10, 10, 0.00,    'frozen');   -- แบน (account ถูก ban)

-- ============================================================
-- 12. transaction_logs
-- ============================================================
INSERT INTO transaction_logs (wallet_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES
(3,  'deposit',       1200.00, 1200.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(4,  'deposit',        300.00,  300.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(2,  'deposit',       2000.00, 2000.00, 'deposit_slip', NULL, 'เติมเงิน Wallet'),
(2,  'payment',       1500.00,  500.00, 'application',  1,    'ชำระค่าเรียนคณิตศาสตร์ (app #1)'),
(6,  'tutor_earnings', 1350.00, 1350.00, 'application',  1,    'รายรับค่าสอน หักค่าธรรมเนียม 10%'),
(1,  'platform_fee',   150.00,  150.00, 'application',  1,    'ค่าธรรมเนียมแพลตฟอร์ม 10%');

-- ============================================================
-- 13. user_bank_accounts
-- ============================================================
INSERT INTO user_bank_accounts (user_id, bank_name, account_number, account_name, is_primary) VALUES
(6,  'ธนาคารกสิกรไทย',    '1234567890', 'มานี มีสุข',    TRUE),
(7,  'ธนาคารกรุงไทย',     '0987654321', 'ชูใจ วิไล',     TRUE),
(8,  'ธนาคารไทยพาณิชย์',  '1122334455', 'อาร์ท ฟิสิกส์',  TRUE),
(2,  'ธนาคารกรุงเทพ',     '5566778899', 'สมชาย ใจดี',    TRUE);

-- ============================================================
-- 14. reports
-- ============================================================
INSERT INTO reports (reporter_id, target_type, target_id, title, description, status) VALUES
(3, 'user', 9,  'ติวเตอร์แอบอ้างคุณสมบัติ',   'ติวเตอร์รายนี้อ้างว่ามีวุฒิการศึกษา แต่ไม่สามารถพิสูจน์ได้', 'pending'),
(2, 'post', 4,  'โพสต์เนื้อหาไม่เหมาะสม',      'โพสต์มีการระบุข้อมูลส่วนตัวที่ไม่ควรเผยแพร่', 'resolved');

-- ============================================================
-- 15. user_action_logs
-- ============================================================
INSERT INTO user_action_logs (user_id, action_type, target_type, target_id, reason, performed_by) VALUES
(6, 'tutor_verified', 'tutor_profile', 1, 'เอกสารครบถ้วน ผ่านการตรวจสอบ', 1),
(7, 'tutor_verified', 'tutor_profile', 2, 'เอกสารครบถ้วน ผ่านการตรวจสอบ', 1),
(8, 'tutor_verified', 'tutor_profile', 3, 'เอกสารครบถ้วน ผ่านการตรวจสอบ', 1),
(10, 'account_banned', 'user', 10, 'ละเมิดข้อกำหนดการใช้งานซ้ำหลายครั้ง', 1);

SET FOREIGN_KEY_CHECKS = 1;
