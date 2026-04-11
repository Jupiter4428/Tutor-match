-- ============================================================================== 
-- 1. [JOIN] ดึงข้อมูลประกาศหาติวเตอร์ที่ยังเปิดรับ (Open) พร้อมข้อมูลนักเรียนที่ตั้งโพสต์
-- ==============================================================================
SELECT 
    p.post_id, 
    p.subject, 
    p.budget, 
    u.name AS student_name, 
    s.grade_level
FROM `Student_Post` p
JOIN `Student_Profile` s ON p.student_id = s.student_id
JOIN `User` u ON s.user_id = u.user_id
WHERE p.status = 'open'
ORDER BY p.budget DESC;

-- ==============================================================================
-- 2. [Subquery + JOIN] หานักเรียนที่ตั้งงบประมาณสูงกว่า "ค่าเฉลี่ยของงบประมาณทั้งระบบ"
-- ==============================================================================
SELECT 
    u.name AS student_name, 
    p.subject, 
    p.budget
FROM `Student_Post` p
JOIN `Student_Profile` s ON p.student_id = s.student_id
JOIN `User` u ON s.user_id = u.user_id
WHERE p.budget > (
    SELECT AVG(budget) FROM `Student_Post`
);

-- ==============================================================================
-- 3. [GROUP BY + HAVING] หารายชื่อติวเตอร์ที่มีคะแนนรีวิวเฉลี่ยมากกว่า 4 ดาว
-- ==============================================================================
SELECT 
    u.name AS tutor_name, 
    t.hourly_rate, 
    AVG(r.rating) AS average_rating,
    COUNT(r.review_id) AS total_reviews
FROM `Tutor_Profile` t
JOIN `User` u ON t.user_id = u.user_id
JOIN `Application` a ON t.tutor_id = a.tutor_id
JOIN `Review` r ON a.app_id = r.app_id
GROUP BY t.tutor_id, u.name, t.hourly_rate
HAVING average_rating >= 4.0;

-- ==============================================================================
-- 4. [GROUP BY + Multiple JOIN] สรุปรายได้รวมของแพลตฟอร์ม (Platform Fee) แยกตามติวเตอร์
-- ==============================================================================
SELECT 
    u.name AS tutor_name, 
    COUNT(p.payment_id) AS total_jobs_paid,
    SUM(p.amount) AS total_money_generated,
    SUM(p.platform_fee) AS total_platform_profit
FROM `Payment` p
JOIN `Application` a ON p.app_id = a.app_id
JOIN `Tutor_Profile` t ON a.tutor_id = t.tutor_id
JOIN `User` u ON t.user_id = u.user_id
WHERE p.status = 'completed'
GROUP BY t.tutor_id, u.name;

-- ==============================================================================
-- 5. [Subquery แบบ IN] ดึงข้อมูลผู้ใช้งานระบบทั้งหมด ที่เคยมีการเขียนรีวิวอย่างน้อย 1 ครั้ง
-- ==============================================================================
SELECT 
    user_id, 
    name, 
    email, 
    created_at
FROM `User`
WHERE user_id IN (
    SELECT s.user_id 
    FROM `Student_Profile` s
    JOIN `Student_Post` p ON s.student_id = p.student_id
    JOIN `Application` a ON p.post_id = a.post_id
    JOIN `Review` r ON a.app_id = r.app_id
);
