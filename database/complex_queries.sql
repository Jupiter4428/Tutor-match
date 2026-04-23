-- ============================================================
-- complex_queries.sql — Query ซับซ้อนสำหรับ Report / Dashboard
-- ใช้ชื่อตารางตาม schema จริง (tutor_match)
-- ============================================================

USE tutor_match;

-- ==============================================================================
-- 1. [JOIN] โพสต์หาติวเตอร์ที่เปิดรับอยู่ พร้อมข้อมูลนักเรียนและรูปแบบการเรียน
-- ==============================================================================
SELECT
    p.post_id,
    p.subject,
    p.grade_level,
    p.learning_format,
    p.location,
    p.preferred_time,
    p.budget,
    u.name         AS student_name,
    sp.school_name
FROM student_posts p
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u              ON sp.user_id   = u.user_id
WHERE p.status   = 'open'
  AND p.is_hidden = FALSE
ORDER BY p.created_at DESC;

-- ==============================================================================
-- 2. [Subquery + JOIN] นักเรียนที่ตั้งงบสูงกว่าค่าเฉลี่ยของระบบ
-- ==============================================================================
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

-- ==============================================================================
-- 3. [GROUP BY + HAVING] ติวเตอร์ที่มี rating เฉลี่ย >= 4 ดาว (ที่ verified แล้ว)
-- ==============================================================================
SELECT
    u.name            AS tutor_name,
    tp.hourly_rate,
    AVG(r.rating)     AS avg_rating,
    COUNT(r.review_id) AS total_reviews
FROM tutor_profiles tp
JOIN users u        ON tp.user_id  = u.user_id
JOIN applications a ON tp.tutor_id = a.tutor_id
JOIN reviews r      ON a.app_id    = r.app_id
WHERE tp.verification_status = 'verified'
  AND r.is_hidden = FALSE
GROUP BY tp.tutor_id, u.name, tp.hourly_rate
HAVING avg_rating >= 4.0
ORDER BY avg_rating DESC;

-- ==============================================================================
-- 4. [GROUP BY + Multiple JOIN] รายได้รวมของแพลตฟอร์ม แยกตามติวเตอร์
-- ==============================================================================
SELECT
    u.name              AS tutor_name,
    COUNT(pay.payment_id) AS total_jobs_paid,
    SUM(pay.amount)       AS total_billed,
    SUM(pay.platform_fee) AS total_platform_fee,
    SUM(pay.amount - pay.platform_fee) AS tutor_net_earnings
FROM payments pay
JOIN applications a  ON pay.app_id   = a.app_id
JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
JOIN users u         ON tp.user_id   = u.user_id
WHERE pay.status = 'completed'
GROUP BY tp.tutor_id, u.name
ORDER BY total_billed DESC;

-- ==============================================================================
-- 5. [Subquery IN] นักเรียนที่เคยเขียนรีวิวอย่างน้อย 1 ครั้ง
-- ==============================================================================
SELECT
    u.user_id,
    u.name,
    u.email,
    u.created_at
FROM users u
WHERE u.user_id IN (
    SELECT sp.user_id
    FROM student_profiles sp
    JOIN student_posts     p  ON sp.student_id = p.student_id
    JOIN applications      a  ON p.post_id     = a.post_id
    JOIN reviews           r  ON a.app_id      = r.app_id
    WHERE r.is_hidden = FALSE
);

-- ==============================================================================
-- 6. [LEFT JOIN + COALESCE] สรุปยอด Wallet ของทุก user พร้อมสถานะ
-- ==============================================================================
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

-- ==============================================================================
-- 7. [JOIN + CASE] รายการสมัครทั้งหมด พร้อมสถานะการสอนและการชำระเงิน
-- ==============================================================================
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
    END              AS payment_status,
    pay.amount
FROM applications a
JOIN student_posts    p         ON a.post_id    = p.post_id
JOIN student_profiles sp        ON p.student_id = sp.student_id
JOIN users            u_student ON sp.user_id   = u_student.user_id
JOIN tutor_profiles   tp        ON a.tutor_id   = tp.tutor_id
JOIN users            u_tutor   ON tp.user_id   = u_tutor.user_id
LEFT JOIN payments    pay       ON a.app_id     = pay.app_id
ORDER BY a.applied_at DESC;

-- ==============================================================================
-- 8. [GROUP BY + Subquery] ประวัติการทำธุรกรรมของแต่ละ user (transaction summary)
-- ==============================================================================
SELECT
    u.name,
    u.role,
    COUNT(tl.transaction_id)     AS total_transactions,
    SUM(CASE WHEN tl.amount > 0 THEN tl.amount  ELSE 0 END) AS total_in,
    SUM(CASE WHEN tl.amount < 0 THEN tl.amount  ELSE 0 END) AS total_out,
    w.balance                    AS current_balance
FROM users u
JOIN wallets w          ON u.user_id   = w.user_id
JOIN transaction_logs tl ON w.wallet_id = tl.wallet_id
GROUP BY u.user_id, u.name, u.role, w.balance
ORDER BY total_transactions DESC;

-- ==============================================================================
-- 9. [JOIN + HAVING] ติวเตอร์ที่มีการสมัครค้างอยู่ (pending) มากกว่า 1 งาน
-- ==============================================================================
SELECT
    u.name         AS tutor_name,
    tp.hourly_rate,
    tp.verification_status,
    COUNT(a.app_id) AS pending_applications
FROM tutor_profiles tp
JOIN users u        ON tp.user_id  = u.user_id
JOIN applications a ON tp.tutor_id = a.tutor_id
WHERE a.status = 'pending'
GROUP BY tp.tutor_id, u.name, tp.hourly_rate, tp.verification_status
HAVING pending_applications > 1;

-- ==============================================================================
-- 10. [JOIN] ประวัติการกระทำของแอดมิน (audit log)
-- ==============================================================================
SELECT
    ual.log_id,
    ual.action_type,
    ual.target_type,
    ual.target_id,
    u_target.name     AS target_user_name,
    u_admin.name      AS performed_by_name,
    ual.reason,
    ual.created_at
FROM user_action_logs ual
LEFT JOIN users u_target ON ual.user_id      = u_target.user_id
JOIN  users u_admin      ON ual.performed_by = u_admin.user_id
ORDER BY ual.created_at DESC;
