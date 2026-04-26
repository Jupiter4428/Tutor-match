-- ============================================================
-- complex_queries.sql
-- รวม Query ทั้งหมดในระบบ เรียงจากง่ายไปยาก
-- ============================================================

USE tutor_match;


-- ============================================================
-- LEVEL 1 — Single Table (ตารางเดียว ไม่มี JOIN)
-- ============================================================
-- ง่ายที่สุด: SELECT / INSERT / UPDATE / DELETE ตารางเดียว
-- ไม่มีเงื่อนไขซับซ้อน ใช้ WHERE ตรงๆ
-- ============================================================


-- --------------------------------------------------------------
-- 1. นับจำนวนผู้ใช้ทั้งหมดในระบบ
-- Logic: COUNT(*) นับทุกแถวในตาราง users ไม่มีเงื่อนไขใดๆ
-- --------------------------------------------------------------
SELECT COUNT(*) AS total_users
FROM users;


-- --------------------------------------------------------------
-- 2. ค้นหา user จากอีเมล (ใช้ตอน login)
-- Logic: WHERE email = ? กรองตรงๆ ใช้ index บน email column
-- --------------------------------------------------------------
SELECT user_id, name, email, password_hash, role, account_status
FROM users
WHERE email = 'example@email.com';


-- --------------------------------------------------------------
-- 3. ดึง student_id จาก user_id
-- Logic: ตาราง student_profiles เก็บ FK ไปหา users
--        เวลาต้องการ student_id จึงต้อง lookup จาก user_id ก่อนเสมอ
-- --------------------------------------------------------------
SELECT student_id
FROM student_profiles
WHERE user_id = 1;


-- --------------------------------------------------------------
-- 4. ดึงกระเป๋าเงินพร้อมล็อคแถว (FOR UPDATE)
-- Logic: FOR UPDATE ล็อค row ไว้ก่อนแก้ไขยอดเงิน
--        ป้องกัน race condition เมื่อมีหลาย request พร้อมกัน
-- --------------------------------------------------------------
SELECT wallet_id, balance
FROM wallets
WHERE user_id = 1
FOR UPDATE;


-- --------------------------------------------------------------
-- 5. ดึงประวัติ transaction ของกระเป๋าเงิน เรียงใหม่สุดก่อน
-- Logic: DATE_FORMAT แปลงวันที่เป็น string ที่อ่านง่าย
--        ORDER BY DESC เพื่อให้รายการล่าสุดอยู่ด้านบน
-- --------------------------------------------------------------
SELECT
    transaction_id,
    transaction_type,
    amount,
    balance_after,
    reference_type,
    description,
    DATE_FORMAT(transaction_date, '%d %b %Y %H:%i') AS formatted_date
FROM transaction_logs
WHERE wallet_id = 1
ORDER BY transaction_date DESC;


-- --------------------------------------------------------------
-- 6. อัปเดตสถานะบัญชีผู้ใช้ (ban / suspended / active)
-- Logic: UPDATE ตรงๆ ไม่มีเงื่อนไขซับซ้อน
--        ใช้ parameterized query ป้องกัน SQL Injection
-- --------------------------------------------------------------
UPDATE users
SET account_status = 'ban'
WHERE user_id = 1;


-- --------------------------------------------------------------
-- 7. อัปเดตสถานะการสอน (not_started → ongoing → completed)
-- Logic: teaching_status ใช้ enum-like string ควบคุม flow การสอน
--        เปลี่ยนได้ทีละขั้น ไม่สามารถข้ามขั้นได้
-- --------------------------------------------------------------
UPDATE applications
SET teaching_status = 'ongoing'
WHERE app_id = 1;


-- --------------------------------------------------------------
-- 8. ลบรีวิว (Hard Delete)
-- Logic: ใช้ DELETE ตรงๆ เพราะรีวิวไม่ได้เก็บประวัติไว้
--        ตรวจสอบสิทธิ์ใน Python ก่อนจะมาถึง query นี้
-- --------------------------------------------------------------
DELETE FROM reviews
WHERE review_id = 1;


-- ============================================================
-- LEVEL 2 — Simple JOIN (ตั้งแต่ 2 ตารางขึ้นไป)
-- ============================================================
-- ใช้ JOIN เพื่อดึงข้อมูลจากหลายตาราง
-- ยังไม่มี Subquery หรือ Aggregate ซับซ้อน
-- ============================================================


-- --------------------------------------------------------------
-- 9. ดึงโปรไฟล์ติวเตอร์พร้อม name และ email จากตาราง users
-- Logic: tutor_profiles เก็บข้อมูลการสอน, users เก็บชื่อและอีเมล
--        JOIN สองตารางเพื่อได้ข้อมูลครบ
-- --------------------------------------------------------------
SELECT
    tp.tutor_id,
    tp.bio,
    tp.hourly_rate,
    tp.verification_status,
    tp.profile_picture_url,
    u.name,
    u.email
FROM tutor_profiles tp
JOIN users u ON tp.user_id = u.user_id
WHERE tp.user_id = 1;


-- --------------------------------------------------------------
-- 10. ดึงรายชื่อผู้ใช้ทั้งหมด (Admin) พร้อมข้อมูล tutor
-- Logic: LEFT JOIN เพราะ student ไม่มีแถวใน tutor_profiles
--        ถ้าเป็น student จะได้ NULL กลับมาจาก tp columns
-- --------------------------------------------------------------
SELECT
    u.user_id,
    u.name,
    u.email,
    u.role,
    u.account_status,
    u.created_at,
    tp.profile_picture_url,
    tp.verification_status
FROM users u
LEFT JOIN tutor_profiles tp ON tp.user_id = u.user_id
ORDER BY u.created_at DESC;


-- --------------------------------------------------------------
-- 11. ดึงรายการรายงานพร้อมชื่อและอีเมลของผู้รายงาน
-- Logic: reports.reporter_id → users.user_id
--        JOIN เพื่อแสดง human-readable name แทน id ดิบ
-- --------------------------------------------------------------
SELECT
    r.report_id,
    r.title,
    r.description,
    r.target_type,
    r.target_id,
    r.status,
    r.created_at,
    u.name  AS reporter_name,
    u.email AS reporter_email
FROM reports r
JOIN users u ON r.reporter_id = u.user_id
ORDER BY r.created_at DESC;


-- --------------------------------------------------------------
-- 12. ดึงโพสต์หาติวเตอร์ที่ยังเปิดอยู่ พร้อมชื่อนักเรียน
-- Logic: student_posts → student_profiles → users (3 ตาราง)
--        is_hidden = FALSE กันโพสต์ที่ admin ซ่อนไว้
-- --------------------------------------------------------------
SELECT
    p.post_id,
    p.subject,
    p.grade_level,
    p.learning_format,
    p.location,
    p.preferred_time,
    p.description,
    p.budget,
    p.created_at,
    u.name AS student_name
FROM student_posts p
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u ON sp.user_id = u.user_id
WHERE p.status = 'open'
  AND p.is_hidden = FALSE
ORDER BY p.created_at DESC;


-- --------------------------------------------------------------
-- 13. ดึงประวัติใบสมัครของติวเตอร์พร้อมข้อมูลโพสต์
-- Logic: applications → student_posts → student_profiles → users
--        chain JOIN 4 ตารางเพื่อดูว่าแต่ละใบสมัครเป็นโพสต์ของใคร
-- --------------------------------------------------------------
SELECT
    a.app_id,
    a.status AS application_status,
    a.applied_at,
    p.post_id,
    p.subject,
    p.grade_level,
    p.learning_format,
    p.location,
    p.preferred_time,
    p.budget,
    u.name AS student_name
FROM applications a
JOIN student_posts p ON a.post_id = p.post_id
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u ON sp.user_id = u.user_id
WHERE a.tutor_id = 1
ORDER BY a.applied_at DESC;


-- --------------------------------------------------------------
-- 14. ดึงตารางสอนของติวเตอร์ (applications ที่ accepted แล้ว)
-- Logic: LEFT JOIN payments เพราะบางงานยังไม่มีการชำระเงิน
--        ถ้า JOIN ปกติ งานที่ยังไม่จ่ายจะหายไปจากผลลัพธ์
-- --------------------------------------------------------------
SELECT
    a.app_id,
    a.applied_at,
    a.teaching_status,
    p.subject,
    p.grade_level,
    p.learning_format,
    p.location,
    p.preferred_time,
    p.budget,
    u.name AS student_name,
    pay.payment_id,
    pay.status AS payment_status
FROM applications a
JOIN student_posts p ON a.post_id = p.post_id
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u ON sp.user_id = u.user_id
LEFT JOIN payments pay ON a.app_id = pay.app_id
WHERE a.tutor_id = 1
  AND a.status = 'accepted'
ORDER BY a.applied_at DESC;


-- ============================================================
-- LEVEL 3 — GROUP BY / Aggregate / CASE WHEN
-- ============================================================
-- ใช้ฟังก์ชัน Aggregate (COUNT, SUM, AVG) คู่กับ GROUP BY
-- หรือ CASE WHEN เพื่อแปลงค่าแบบ conditional
-- ============================================================


-- --------------------------------------------------------------
-- 15. สรุป rating แยกตามจำนวนดาว (1-5) พร้อม avg และ total
-- Logic: CASE WHEN ทำหน้าที่เป็น pivot — แต่ละเงื่อนไข
--        นับเฉพาะรีวิวที่ตรงกับดาวนั้นๆ (conditional COUNT)
--        ใช้ SUM(CASE...) แทน COUNT(CASE...) เพื่อให้ได้ 0 แทน NULL
-- --------------------------------------------------------------
SELECT
    COUNT(*)                                            AS total_reviews,
    ROUND(AVG(r.rating), 1)                            AS avg_rating,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)      AS five_star,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)      AS four_star,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)      AS three_star,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)      AS two_star,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)      AS one_star
FROM reviews r
JOIN applications a ON r.app_id = a.app_id
JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
WHERE r.is_hidden = FALSE
  AND tp.tutor_id = 1;  -- ลบบรรทัดนี้เพื่อดูภาพรวมทั้งระบบ


-- --------------------------------------------------------------
-- 16. ดึงรายการสมัครทั้งหมดพร้อมสถานะชำระเงินแบบอ่านง่าย
-- Logic: CASE WHEN แปลง payment status code → ข้อความภาษาไทย
--        LEFT JOIN payments เพราะบางงานอาจยังไม่มีการจ่ายเงิน
--        ใช้ alias ซ้อนกันหลายตัวเพื่อ JOIN ตาราง users 2 ครั้ง
--        (u_student สำหรับนักเรียน, u_tutor สำหรับติวเตอร์)
-- --------------------------------------------------------------
SELECT
    a.app_id,
    p.subject,
    u_student.name  AS student_name,
    u_tutor.name    AS tutor_name,
    a.status        AS application_status,
    a.teaching_status,
    CASE
        WHEN pay.status = 'completed' THEN 'ชำระแล้ว'
        WHEN pay.status = 'pending'   THEN 'รอชำระ'
        ELSE 'ยังไม่มีการชำระ'
    END             AS payment_status_text,
    pay.amount
FROM applications a
JOIN student_posts    p         ON a.post_id    = p.post_id
JOIN student_profiles sp        ON p.student_id = sp.student_id
JOIN users            u_student ON sp.user_id   = u_student.user_id
JOIN tutor_profiles   tp        ON a.tutor_id   = tp.tutor_id
JOIN users            u_tutor   ON tp.user_id   = u_tutor.user_id
LEFT JOIN payments    pay       ON a.app_id     = pay.app_id
ORDER BY a.applied_at DESC;


-- --------------------------------------------------------------
-- 17. ติวเตอร์ที่มี rating เฉลี่ย >= 4 ดาว (verified แล้ว)
-- Logic: GROUP BY รวมรีวิวทุกอันของติวเตอร์คนเดียวกัน
--        HAVING กรองหลัง aggregate (ต่างจาก WHERE ที่กรองก่อน)
--        ใส่ทั้ง tutor_id และ u.name ใน GROUP BY เพื่อให้ query ถูกต้อง
-- --------------------------------------------------------------
SELECT
    u.name              AS tutor_name,
    tp.hourly_rate,
    ROUND(AVG(r.rating), 1)  AS avg_rating,
    COUNT(r.review_id)  AS total_reviews
FROM tutor_profiles tp
JOIN users u        ON tp.user_id  = u.user_id
JOIN applications a ON tp.tutor_id = a.tutor_id
JOIN reviews r      ON a.app_id    = r.app_id
WHERE tp.verification_status = 'verified'
  AND r.is_hidden = FALSE
GROUP BY tp.tutor_id, u.name, tp.hourly_rate
HAVING avg_rating >= 4.0
ORDER BY avg_rating DESC;


-- --------------------------------------------------------------
-- 18. ติวเตอร์ที่มีใบสมัครค้าง (pending) มากกว่า 1 งาน
-- Logic: GROUP BY รวมใบสมัครแต่ละคน
--        HAVING COUNT > 1 กรองเฉพาะคนที่มีงานค้างหลายงาน
-- --------------------------------------------------------------
SELECT
    u.name              AS tutor_name,
    tp.hourly_rate,
    tp.verification_status,
    COUNT(a.app_id)     AS pending_applications
FROM tutor_profiles tp
JOIN users u        ON tp.user_id  = u.user_id
JOIN applications a ON tp.tutor_id = a.tutor_id
WHERE a.status = 'pending'
GROUP BY tp.tutor_id, u.name, tp.hourly_rate, tp.verification_status
HAVING pending_applications > 1;


-- --------------------------------------------------------------
-- 19. รายได้รวมของแพลตฟอร์ม แยกตามติวเตอร์
-- Logic: SUM หลายคอลัมน์พร้อมกัน
--        tutor_net_earnings คำนวณในตัว query (ไม่ต้องคำนวณใน Python)
--        กรองเฉพาะ payment ที่ completed เท่านั้น
-- --------------------------------------------------------------
SELECT
    u.name                              AS tutor_name,
    COUNT(pay.payment_id)               AS total_jobs_paid,
    SUM(pay.amount)                     AS total_billed,
    SUM(pay.platform_fee)               AS total_platform_fee,
    SUM(pay.amount - pay.platform_fee)  AS tutor_net_earnings
FROM payments pay
JOIN applications  a  ON pay.app_id   = a.app_id
JOIN tutor_profiles tp ON a.tutor_id  = tp.tutor_id
JOIN users u           ON tp.user_id  = u.user_id
WHERE pay.status = 'completed'
GROUP BY tp.tutor_id, u.name
ORDER BY total_billed DESC;


-- ============================================================
-- LEVEL 4 — Subquery / COALESCE / Multi-aggregate
-- ============================================================
-- ใช้ Subquery ทั้งแบบ IN, Correlated, และ Scalar Subquery
-- ใช้ COALESCE จัดการ NULL
-- ============================================================


-- --------------------------------------------------------------
-- 20. Wallet ของทุก user พร้อมยอดเงิน (user ที่ไม่มี wallet ได้ 0)
-- Logic: LEFT JOIN เพราะ user ใหม่อาจยังไม่มี wallet
--        COALESCE(w.balance, 0.00) แปลง NULL → 0
--        ถ้าใช้ JOIN ปกติ user ที่ไม่มี wallet จะหายไป
-- --------------------------------------------------------------
SELECT
    u.user_id,
    u.name,
    u.role,
    u.account_status,
    COALESCE(w.balance, 0.00) AS wallet_balance,
    w.status                  AS wallet_status
FROM users u
LEFT JOIN wallets w ON u.user_id = w.user_id
ORDER BY u.role, u.user_id;


-- --------------------------------------------------------------
-- 21. นักเรียนที่ตั้งงบสูงกว่าค่าเฉลี่ยของระบบ
-- Logic: Subquery ใน WHERE คำนวณ AVG(budget) ทั้งตารางก่อน
--        แล้วนำมาเปรียบเทียบกับแต่ละโพสต์
--        Subquery แบบนี้รันครั้งเดียว ไม่ใช่ Correlated
-- --------------------------------------------------------------
SELECT
    u.name         AS student_name,
    p.subject,
    p.budget,
    p.learning_format
FROM student_posts p
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u              ON sp.user_id   = u.user_id
WHERE p.budget > (
    SELECT AVG(budget) FROM student_posts
)
ORDER BY p.budget DESC;


-- --------------------------------------------------------------
-- 22. สรุปยอดรับ-จ่ายของแต่ละ user จาก transaction_logs
-- Logic: CASE WHEN แยก transaction เป็น "รับเข้า" (amount > 0)
--        และ "จ่ายออก" (amount < 0) แล้ว SUM แต่ละฝั่ง
--        GROUP BY ทุก column ที่ไม่ได้ aggregate ต้องใส่หมด
-- --------------------------------------------------------------
SELECT
    u.name,
    u.role,
    COUNT(tl.transaction_id)                                  AS total_transactions,
    SUM(CASE WHEN tl.amount > 0 THEN tl.amount ELSE 0 END)   AS total_in,
    SUM(CASE WHEN tl.amount < 0 THEN ABS(tl.amount) ELSE 0 END) AS total_out,
    w.balance                                                 AS current_balance
FROM users u
JOIN wallets w          ON u.user_id   = w.user_id
JOIN transaction_logs tl ON w.wallet_id = tl.wallet_id
GROUP BY u.user_id, u.name, u.role, w.balance
ORDER BY total_transactions DESC;


-- --------------------------------------------------------------
-- 23. นักเรียนที่เคยเขียนรีวิวอย่างน้อย 1 ครั้ง
-- Logic: Subquery แบบ IN — ติดตาม FK chain ยาว 4 ตาราง
--        student_profiles → student_posts → applications → reviews
--        IN (subquery) อ่านง่ายกว่า EXISTS ในกรณีนี้
-- --------------------------------------------------------------
SELECT
    u.user_id,
    u.name,
    u.email,
    u.created_at
FROM users u
WHERE u.user_id IN (
    SELECT sp.user_id
    FROM student_profiles sp
    JOIN student_posts  p ON sp.student_id = p.student_id
    JOIN applications   a ON p.post_id     = a.post_id
    JOIN reviews        r ON a.app_id      = r.app_id
    WHERE r.is_hidden = FALSE
);


-- --------------------------------------------------------------
-- 24. ดึงรีวิวทั้งหมดพร้อม filter แบบ dynamic (5 JOINs)
-- Logic: JOIN 5 ตารางเพื่อดึง: ชื่อนักเรียน, ชื่อติวเตอร์, วิชา
--        ผ่านเส้นทาง reviews → applications → tutor_profiles → users
--        และ applications → student_posts → student_profiles → users
--        (ใช้ users 2 ครั้งในเส้นทางต่างกัน)
-- --------------------------------------------------------------
SELECT
    r.review_id,
    r.rating,
    r.comment,
    r.created_at,
    u.name      AS student_name,
    tu.name     AS tutor_name,
    tp.tutor_id,
    sp.subject
FROM reviews r
JOIN applications    a   ON r.app_id    = a.app_id
JOIN tutor_profiles  tp  ON a.tutor_id  = tp.tutor_id
JOIN users           tu  ON tp.user_id  = tu.user_id
JOIN student_posts   sp  ON a.post_id   = sp.post_id
JOIN student_profiles stp ON sp.student_id = stp.student_id
JOIN users           u   ON stp.user_id = u.user_id
WHERE r.is_hidden = FALSE
ORDER BY r.created_at DESC;


-- ============================================================
-- LEVEL 5 — Correlated Subquery / Scalar Subquery ใน SELECT
-- ============================================================
-- ซับซ้อนที่สุด: Subquery รันซ้ำสำหรับทุกแถว (Correlated)
-- หรือ Subquery ใน SELECT clause (Scalar Subquery)
-- ============================================================


-- --------------------------------------------------------------
-- 25. สถิติภาพรวมของระบบสำหรับ Admin Dashboard (7 ตัวชี้วัด)
-- Logic: SELECT ตัวเดียวใช้ Scalar Subquery 7 ตัว
--        แต่ละ Subquery นับ COUNT ตามเงื่อนไขต่างกัน
--        ทำให้ได้ผลใน 1 row ไม่ต้องรัน query แยก 7 ครั้ง
-- --------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM users)                                           AS total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'student')                    AS students,
    (SELECT COUNT(*) FROM users WHERE role = 'tutor')                      AS tutors,
    (SELECT COUNT(*) FROM student_posts)                                   AS posts,
    (SELECT COUNT(*) FROM tutor_profiles WHERE verification_status = 'pending') AS pending_verify,
    (SELECT COUNT(*) FROM users WHERE account_status IN ('ban','suspended')) AS banned,
    (SELECT COUNT(*) FROM reports WHERE status = 'pending')                AS pending_reports;


-- --------------------------------------------------------------
-- 26. Dashboard ของติวเตอร์ (4 ตัวชี้วัดใน 1 query)
-- Logic: Correlated Subquery แต่ละตัวรับ tutor_id จาก outer query
--        monthly_income ใช้ MONTH() + YEAR() กรองเฉพาะเดือนปัจจุบัน
--        COALESCE กันกรณีที่ยังไม่มีรีวิวเลย (AVG จะ return NULL)
-- --------------------------------------------------------------
SELECT
    (SELECT COUNT(*)
     FROM applications
     WHERE tutor_id = 1 AND status = 'accepted')                          AS teaching_now,

    (SELECT COUNT(*)
     FROM student_posts
     WHERE status = 'open' AND is_hidden = FALSE)                         AS available_jobs,

    (SELECT COALESCE(SUM(p.budget), 0)
     FROM applications a JOIN student_posts p ON a.post_id = p.post_id
     WHERE a.tutor_id = 1 AND a.status = 'accepted'
       AND MONTH(a.applied_at) = MONTH(CURDATE())
       AND YEAR(a.applied_at)  = YEAR(CURDATE()))                         AS monthly_income,

    (SELECT ROUND(AVG(r.rating), 1)
     FROM reviews r JOIN applications a ON r.app_id = a.app_id
     WHERE a.tutor_id = 1)                                                AS avg_rating;


-- --------------------------------------------------------------
-- 27. ติวเตอร์ verified ทั้งหมดพร้อม avg_rating และ review_count
-- Logic: GROUP BY tp.tutor_id รวมรีวิวทั้งหมดของแต่ละคน
--        LEFT JOIN reviews เพราะติวเตอร์ใหม่อาจยังไม่มีรีวิว
--        AND r.is_hidden = FALSE อยู่ใน JOIN condition (ไม่ใช่ WHERE)
--        เพื่อให้ติวเตอร์ที่ถูกซ่อนรีวิวทั้งหมดยังคงอยู่ในผลลัพธ์
-- --------------------------------------------------------------
SELECT
    tp.tutor_id,
    u.name,
    tp.bio,
    tp.hourly_rate,
    tp.profile_picture_url,
    ROUND(AVG(r.rating), 1) AS avg_rating,
    COUNT(r.review_id)      AS review_count
FROM tutor_profiles tp
JOIN users u ON tp.user_id = u.user_id
LEFT JOIN applications a ON a.tutor_id = tp.tutor_id
LEFT JOIN reviews r      ON r.app_id   = a.app_id AND r.is_hidden = FALSE
WHERE tp.verification_status = 'verified'
  AND u.account_status       = 'active'
GROUP BY tp.tutor_id, u.name, tp.bio, tp.hourly_rate, tp.profile_picture_url
ORDER BY avg_rating DESC, review_count DESC;


-- --------------------------------------------------------------
-- 28. ดึงคอร์สทั้งหมดของนักเรียน (query ที่ซับซ้อนที่สุดในระบบ)
-- Logic: JOIN 6 ตารางหลัก + LEFT JOIN 2 ตาราง
--        ใช้ Correlated Scalar Subquery 3 ตัวใน SELECT clause:
--          - GROUP_CONCAT subjects ของแต่ละ tutor
--          - GROUP_CONCAT experiences ของแต่ละ tutor
--          - AVG rating เฉลี่ยของแต่ละ tutor
--          - COUNT review ทั้งหมดของแต่ละ tutor
--        GROUP_CONCAT ใช้ SEPARATOR '||' เพราะชื่อวิชาอาจมี comma
--        Subquery ต้องมี alias (a2, a3, r2, r3) เพื่อไม่ชนกับ outer
-- --------------------------------------------------------------
SELECT
    a.app_id,
    a.status             AS application_status,
    a.teaching_status,
    a.applied_at,
    sp.post_id,
    sp.subject,
    sp.budget,
    sp.learning_format,
    sp.location,
    sp.preferred_time,
    tp.tutor_id,
    tp.bio               AS tutor_bio,
    tp.hourly_rate,
    tp.profile_picture_url,
    tp.verification_status,
    u.name               AS tutor_name,
    u.email              AS tutor_email,
    p.status             AS payment_status,
    p.amount             AS payment_amount,
    r.review_id,
    r.rating,
    r.comment            AS review_comment,
    -- Subquery 1: รวมวิชาที่ tutor สอนทั้งหมดเป็น string เดียว
    (
        SELECT GROUP_CONCAT(ts.subject SEPARATOR ', ')
        FROM tutor_subjects ts
        WHERE ts.tutor_id = tp.tutor_id
    ) AS tutor_subjects,
    -- Subquery 2: รวมประสบการณ์ทั้งหมดเป็น string คั่นด้วย ||
    (
        SELECT GROUP_CONCAT(te.experience_detail SEPARATOR '||')
        FROM tutor_experiences te
        WHERE te.tutor_id = tp.tutor_id
    ) AS tutor_experiences,
    -- Subquery 3: rating เฉลี่ยของ tutor คนนี้จากทุก application
    (
        SELECT ROUND(AVG(r2.rating), 1)
        FROM applications a2
        JOIN reviews r2 ON r2.app_id = a2.app_id
        WHERE a2.tutor_id = tp.tutor_id
          AND r2.is_hidden = FALSE
    ) AS tutor_average_rating,
    -- Subquery 4: จำนวนรีวิวทั้งหมดของ tutor คนนี้
    (
        SELECT COUNT(r3.review_id)
        FROM applications a3
        JOIN reviews r3 ON r3.app_id = a3.app_id
        WHERE a3.tutor_id = tp.tutor_id
          AND r3.is_hidden = FALSE
    ) AS tutor_review_count
FROM applications a
JOIN student_posts    sp  ON a.post_id   = sp.post_id
JOIN tutor_profiles   tp  ON a.tutor_id  = tp.tutor_id
JOIN users            u   ON tp.user_id  = u.user_id
LEFT JOIN payments    p   ON p.app_id    = a.app_id
LEFT JOIN reviews     r   ON r.app_id    = a.app_id
WHERE sp.student_id = 1
  AND a.status = 'accepted'
ORDER BY a.app_id DESC;


-- --------------------------------------------------------------
-- 29. ยกเลิกการจองและคืนโพสต์เป็น open ด้วย Subquery ใน UPDATE
-- Logic: UPDATE student_posts ต้องรู้ post_id
--        แต่เรารู้แค่ app_id จึงใช้ Subquery ใน WHERE clause
--        SELECT post_id FROM applications WHERE app_id = ?
--        เพื่อหา post_id แล้วเปลี่ยนสถานะกลับเป็น open
-- --------------------------------------------------------------
UPDATE student_posts
SET status = 'open'
WHERE post_id = (
    SELECT post_id
    FROM applications
    WHERE app_id = 1
);


-- --------------------------------------------------------------
-- 30. Audit Log — ประวัติการกระทำของ Admin
-- Logic: LEFT JOIN u_target เพราะ target อาจเป็น object ไม่ใช่ user
--        (เช่น target_type = 'post' จะไม่มี user_id ตรงๆ)
--        JOIN u_admin ใช้ INNER JOIN เพราะต้องมี admin ที่ทำรายการเสมอ
--        ตาราง users ถูก JOIN 2 ครั้งด้วย alias ต่างกัน
-- --------------------------------------------------------------
SELECT
    ual.log_id,
    ual.action_type,
    ual.target_type,
    ual.target_id,
    u_target.name AS target_user_name,
    u_admin.name  AS performed_by_name,
    ual.reason,
    ual.created_at
FROM user_action_logs ual
LEFT JOIN users u_target ON ual.user_id      = u_target.user_id
JOIN  users u_admin      ON ual.performed_by = u_admin.user_id
ORDER BY ual.created_at DESC;
