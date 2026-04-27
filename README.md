<div align="center">
  <h1>🎓 Tutor Match Platform</h1>
  <p><b>ระบบสื่อกลางการจับคู่ระหว่างนักเรียนและติวเตอร์ (CN230 Project)</b></p>

  <img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.1.3-green?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-9.6-orange?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/HTML-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</div>

---

### ภาพรวมของระบบ (System Overview)
แพลตฟอร์มกลางเชื่อมต่อ **นักเรียน** และ **ติวเตอร์** โดยตรง ลดการพึ่งพานายหน้า รองรับระบบ Escrow, รีวิว และการยืนยันตัวตนติวเตอร์โดย Admin

**ผู้ใช้งาน 3 บทบาท:**
- **นักเรียน** — โพสต์หาติวเตอร์, จ่ายเงิน Escrow, เขียนรีวิว
- **ติวเตอร์** — สมัครงานสอน, ตั้งตารางเวลา, รับเงิน
- **Admin** — ยืนยันตัวตนติวเตอร์, จัดการผู้ใช้, ดูสถิติ

---

### 🗄️ โครงสร้างฐานข้อมูล (Database Schema)
ระบบผ่านการทำ **Normalization (3NF, BCNF, 4NF)** และ **Database Optimization** เพื่อลดความซ้ำซ้อนและรองรับ performance

<details>
<summary><b>🔎 คลิกเพื่อดูรายละเอียด 16 ตาราง</b></summary>

| หมวดหมู่ | ตาราง | รายละเอียด |
| :--- | :--- | :--- |
| **User & Profile** | `users`, `student_profiles`, `tutor_profiles` | Single-role design, account lifecycle, verification workflow |
| **Tutor Details** | `tutor_experiences`, `tutor_subjects` | 4NF multi-value, BCNF Composite PK |
| **Posts & Jobs** | `student_posts`, `applications` | moderation fields, teaching_status gate, UNIQUE constraint |
| **Schedule** | `tutor_schedules`, `schedule_bookings` | conflict prevention, Composite UNIQUE |
| **Review** | `reviews` | 3NF อ้างอิงผ่าน app_id, rating 1-5, is_hidden |
| **Finance** | `payments`, `wallets`, `transaction_logs` | Escrow model, platform_fee CHECK, balance snapshot |
| **Audit** | `user_action_logs`, `reports`, `user_bank_accounts` | Enterprise auditability, community moderation |

ดูรายละเอียดเพิ่มเติมได้ที่ [`database/DESIGN.md`](database/DESIGN.md)
</details>

---

### วิธีติดตั้งและรัน

> ⚠️ ต้องติดตั้ง **Python 3.10+** และ **MySQL 9.6** ก่อนเริ่มต้น

#### 1. Clone & ติดตั้ง

```bash
# Clone branch Final
git clone -b Final https://github.com/Jupiter4428/Tutor-match.git project
cd project

# สร้าง virtual environment
python -m venv venv

# อนุญาตรัน script (ทำครั้งเดียวต่อเครื่อง)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# เปิด venv
.\venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# สร้างไฟล์ .env
copy .env.example .env
```

แก้ไฟล์ `.env` ให้ตรงกับเครื่องของตัวเอง:
```env
DB_HOST     = localhost
DB_PORT     = 3306
DB_USER     = root
DB_PASSWORD = <รหัสผ่าน MySQL>
DB_NAME     = tutor_match
SECRET_KEY  = <anything kub>
```

#### 2. Setup Database

**วิธีที่ 1 — ดับเบิลคลิก (แนะนำ)**

| ไฟล์ | ใช้เมื่อ |
|---|---|
| `ayo/setup_db.bat` | ครั้งแรก — สร้าง schema (16 ตาราง) |
| `ayo/seed_db.bat` | ใส่ข้อมูลตัวอย่าง (9 scenarios + 12 reviews) |
| `ayo/reset_db.bat` | Reset ทั้งหมด = setup + seed ใหม่ |
| `ayo/clear_db.bat` | ล้างข้อมูล (โครงสร้างตารางคงอยู่) |

**วิธีที่ 2 — PowerShell**

```bash
# เพิ่ม MySQL ใน PATH (ถ้ายังไม่มี)
$env:PATH += ";C:\Program Files\MySQL\MySQL Server 9.6\bin"

# สร้าง database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tutor_match CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# รัน schema
cmd /c "mysql --default-character-set=utf8mb4 -u root -p tutor_match < database/schema.sql"

# รัน seed (ข้อมูลตัวอย่าง)
cmd /c "mysql --default-character-set=utf8mb4 -u root -p tutor_match < database/seed.sql"

# รัน indexes สำหรับ performance (ทำครั้งเดียว)
cmd /c "mysql --default-character-set=utf8mb4 -u root -p tutor_match < database/add_indexes.sql"
```

#### 3. รัน Server

```bash
# ตรวจสอบว่า venv เปิดอยู่ (เห็น (venv) นำหน้า prompt)
python run.py
# เปิดที่ http://127.0.0.1:5000
```

---

### ข้อมูลตัวอย่าง (Test Accounts)

> รหัสผ่านทุก account คือ **`1234`**

| Role | Email | หมายเหตุ |
|---|---|---|
| Admin | `admin@tutormatch.com` | ดู dashboard, จัดการผู้ใช้ |
| Student | `somchai@test.com` | มีโพสต์ที่จบแล้ว + รีวิว |
| Student | `somying@test.com` | มีโพสต์ open หลายรายการ |
| Tutor | `manee@test.com` | verified, มีรีวิว 5 ดาว |
| Tutor | `art_tutor@test.com` | verified, กำลังสอนอยู่ |
| Tutor | `nid_tutor@test.com` | pending (รอ Admin verify) |

---

### โครงสร้างโปรเจกต์

```
project/
├── ayo/                    ← bat files (setup/seed/reset/clear)
├── backend/
│   ├── app.py              ← Flask app + blueprints + DB teardown
│   ├── extensions.py       ← DB connection pooling
│   ├── models/             ← Table schema definitions (11 files)
│   ├── routes/             ← API endpoints (5 blueprints)
│   ├── services/           ← Business logic (5 services)
│   └── utils/              ← JWT auth helpers
├── frontend/
│   ├── auth/               ← login, register
│   ├── student/            ← home, my_courses, wallet
│   ├── tutor/              ← home, tutor_wallet
│   ├── tutorprofile/       ← profile, edit
│   └── admin/              ← home_admin
├── database/
│   ├── schema.sql          ← 16 tables
│   ├── seed.sql            ← test data (12 reviews, 9 scenarios)
│   ├── add_indexes.sql     ← 8 performance indexes
│   └── DESIGN.md           ← database design documentation
├── static/uploads/         ← profile pictures
├── run.py                  ← Flask entry point (threaded=True)
└── โครงสร้างไฟล์.txt       ← รายละเอียดทุกไฟล์
```

---

### API Endpoints

<details>
<summary><b>คลิกดู endpoints ทั้งหมด</b></summary>

**Auth** `/auth`
```
POST /auth/register    สมัครสมาชิก (student/tutor)
POST /auth/login       เข้าสู่ระบบ → JWT token
```

**Student** `/student`
```
GET  /student/posts                  ดูโพสต์ของตัวเอง
POST /student/post                   สร้างโพสต์ใหม่
DELETE /student/post/<id>            ลบโพสต์
GET  /student/applications/<post_id> ดูผู้สมัคร
POST /student/respond                ยอมรับ/ปฏิเสธ tutor
GET  /student/my-courses             คอร์สที่เรียนทั้งหมด
POST /student/api/pay                จ่าย Escrow
POST /student/api/confirm-class      ยืนยันการเรียน (payout 90/10)
POST /student/api/cancel-booking     ยกเลิก (refund 97%)
GET  /student/api/wallet             ยอดเงิน wallet
GET  /student/api/wallet/transactions ประวัติธุรกรรม
POST /student/api/wallet/deposit     ฝากเงิน
POST /student/api/wallet/withdraw    ถอนเงิน
```

**Tutor** `/tutor`
```
GET  /tutor/profile           ดูโปรไฟล์ตัวเอง
PUT  /tutor/profile           แก้ไขโปรไฟล์
GET  /tutor/list              รายชื่อ tutor ทั้งหมด (verified)
GET  /tutor/profile/<id>      ดูโปรไฟล์ tutor รายบุคคล
POST /tutor/apply             สมัครงานจากโพสต์
GET  /tutor/my-applications   งานที่สมัครไป
GET  /tutor/posts             งานที่เปิดรับสมัคร
GET  /tutor/dashboard         stats สำหรับ dashboard
GET  /tutor/schedule          ตารางสอน
POST /tutor/api/class/start   เริ่มสอน
POST /tutor/api/class/end     จบสอน
GET  /tutor/api/wallet        ยอดเงิน wallet
GET  /tutor/api/wallet/transactions ประวัติธุรกรรม
POST /tutor/api/wallet/withdraw    ถอนเงิน
```

**Reviews** `/reviews`
```
GET    /reviews               ดูรีวิวทั้งหมด (filter ได้)
GET    /reviews/tutor/<id>/summary สรุป rating ของ tutor
POST   /reviews               เขียนรีวิว (ต้อง teaching_status=completed)
POST   /reviews/my-options    งานที่เขียนรีวิวได้
DELETE /reviews/<id>          ลบรีวิวของตัวเอง
```

**Admin** `/admin`
```
GET  /admin/stats             สถิติระบบทั้งหมด
GET  /admin/users             รายชื่อ users
POST /admin/users/status      เปลี่ยนสถานะ (active/suspended/ban)
GET  /admin/reports           รายงานปัญหา
POST /admin/reviews/hide      ซ่อนรีวิว
DELETE /admin/reviews/<id>    ลบรีวิว
```
</details>

---

### 🗃️ คำสั่ง SQL ที่ใช้บ่อย

#### เข้า MySQL Shell
```bash
mysql -u root -p
# Enter password → พิมพ์รหัสผ่าน MySQL
USE tutor_match;
```

#### ดูข้อมูลพื้นฐาน
```sql
-- ดู users ทั้งหมด
SELECT user_id, name, email, role, account_status FROM users;

-- ดู tutors พร้อมสถานะ verify
SELECT tp.tutor_id, u.name, u.email, tp.verification_status, tp.hourly_rate
FROM tutor_profiles tp JOIN users u ON tp.user_id = u.user_id;

-- ดูโพสต์ที่ยังเปิดรับสมัคร
SELECT p.post_id, p.subject, p.budget, p.learning_format, u.name AS student
FROM student_posts p
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u ON sp.user_id = u.user_id
WHERE p.status = 'open' AND p.is_hidden = FALSE;

-- ดูรีวิวทั้งหมดพร้อมชื่อ
SELECT r.review_id, r.rating, r.comment,
       u_s.name AS student_name, u_t.name AS tutor_name
FROM reviews r
JOIN applications a ON r.app_id = a.app_id
JOIN student_posts p ON a.post_id = p.post_id
JOIN student_profiles sp ON p.student_id = sp.student_id
JOIN users u_s ON sp.user_id = u_s.user_id
JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
JOIN users u_t ON tp.user_id = u_t.user_id
ORDER BY r.created_at DESC;

-- ดู avg rating แต่ละ tutor
SELECT u.name, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(r.review_id) AS reviews
FROM tutor_profiles tp
JOIN users u ON tp.user_id = u.user_id
LEFT JOIN applications a ON a.tutor_id = tp.tutor_id
LEFT JOIN reviews r ON r.app_id = a.app_id
GROUP BY tp.tutor_id, u.name
ORDER BY avg_rating DESC;

-- ดูยอด wallet ทุก user
SELECT u.name, u.role, w.balance, w.status
FROM wallets w JOIN users u ON w.user_id = u.user_id
ORDER BY w.balance DESC;

-- ดูประวัติธุรกรรมทั้งหมด
SELECT tl.transaction_id, u.name, tl.transaction_type,
       tl.amount, tl.balance_after, tl.transaction_date
FROM transaction_logs tl
JOIN wallets w ON tl.wallet_id = w.wallet_id
JOIN users u ON w.user_id = u.user_id
ORDER BY tl.transaction_date DESC;
```

#### จัดการข้อมูล
```sql
-- เพิ่ม Admin user (รหัสผ่าน: 1234)
INSERT INTO users (name, email, password_hash, role, account_status)
VALUES (
    'superuser',
    'admin@tutormatch.com',
    '$2b$12$m4ixkpFMtcS0aMutT/bPJerq11YqM/VmUeAY6LQf9wgsmAiKfyEO2',
    'admin',
    'active'
);

-- Ban ผู้ใช้
UPDATE users SET account_status = 'ban' WHERE user_id = ?;

-- ยืนยัน tutor
UPDATE tutor_profiles
SET verification_status = 'verified', verified_by = 1, verified_at = NOW()
WHERE tutor_id = ?;

-- ซ่อนโพสต์
UPDATE student_posts
SET is_hidden = TRUE, moderation_reason = 'ละเมิดกฎการใช้งาน'
WHERE post_id = ?;
```

#### ล้างและ Reset ข้อมูล
```sql
-- ล้างข้อมูลทั้งหมด (โครงสร้างตารางคงอยู่)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_action_logs;
TRUNCATE TABLE reports;
TRUNCATE TABLE transaction_logs;
TRUNCATE TABLE wallets;
TRUNCATE TABLE payments;
TRUNCATE TABLE reviews;
TRUNCATE TABLE schedule_bookings;
TRUNCATE TABLE tutor_schedules;
TRUNCATE TABLE applications;
TRUNCATE TABLE student_posts;
TRUNCATE TABLE tutor_subjects;
TRUNCATE TABLE tutor_experiences;
TRUNCATE TABLE tutor_profiles;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE user_bank_accounts;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

#### ตรวจสอบ Indexes
```sql
-- ดู indexes ทั้งหมดใน database
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'tutor_match'
ORDER BY TABLE_NAME, INDEX_NAME;
```

#### Admin Dashboard Queries
```sql
-- สรุปสถิติระบบ
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
    (SELECT COUNT(*) FROM users WHERE role = 'tutor')   AS tutors,
    (SELECT COUNT(*) FROM student_posts)                AS posts,
    (SELECT COUNT(*) FROM applications WHERE status = 'accepted') AS matched,
    (SELECT COALESCE(SUM(platform_fee), 0) FROM payments WHERE status = 'completed') AS total_revenue;

-- Top 5 วิชาที่มีโพสต์มากสุด
SELECT subject, COUNT(*) AS post_count
FROM student_posts
GROUP BY subject
ORDER BY post_count DESC
LIMIT 5;

-- Tutor ที่รอ verify
SELECT tp.tutor_id, u.name, u.email, tp.verification_submitted_at
FROM tutor_profiles tp
JOIN users u ON tp.user_id = u.user_id
WHERE tp.verification_status = 'pending'
ORDER BY tp.verification_submitted_at ASC;
```

---

### 🛠️ Development

```bash
# ขั้นตอนการ push
git checkout Final
git pull origin Final

# add และ commit
git add <ไฟล์>
git commit -m "อธิบายสั้นๆ ว่าแก้อะไร"
git push origin Final
```

---

<table align="center" style="width: 100%; border-collapse: collapse;">
<tr style="background-color: #f8fafc;">
<th align="center" style="padding: 10px;">บทบาท (Role)</th>
<th align="center" style="padding: 10px;">ชื่อ-นามสกุล</th>
<th align="center" style="padding: 10px;">รหัสนักศึกษา</th>
</tr>
<tr>
<td align="center"><b>Database & Backend Architect</b></td>
<td align="center">นายกฤตยชญ์ แก้วกำมา</td>
<td align="center">6710535011</td>
</tr>
<tr>
<td align="center"><b>Technical Lead & Backend Architect</b></td>
<td align="center">นายวุฒิศักดิ์ บุญกัน</td>
<td align="center">6710535029</td>
</tr>
<tr>
<td align="center"><b>Database & Backend Architec</b></td>
<td align="center">นายภูวรัตน์ นาคจันทึก</td>
<td align="center">6710615201</td>
</tr>
<tr>
<td align="center"><b>Frontend & UI/UX Design</b></td>
<td align="center">นายธนกฤต โพธิมาศ</td>
<td align="center">6710625010</td>
</tr>
</table>

<p align="right"><i>Project Version BETA
