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

### 📖 ภาพรวมของระบบ (System Overview)
แพลตฟอร์มที่เชื่อมต่อระหว่าง **นักเรียน** และ **ติวเตอร์** โดยเน้นความน่าเชื่อถือผ่านระบบยืนยันตัวตนและรีวิวที่ออกแบบตามหลักฐานข้อมูลที่ถูกต้อง

---

### 🗄️ โครงสร้างฐานข้อมูล (Database Schema)
ระบบผ่านการทำ **Normalization (3NF, BCNF, 4NF)** เพื่อลดความซ้ำซ้อนและรองรับความปลอดภัย

<details>
<summary><b>🔎 คลิกเพื่อดูรายละเอียด 12 ตาราง</b></summary>

| หมวดหมู่ | รายชื่อตาราง (Tables) | รายละเอียด |
| :--- | :--- | :--- |
| **Identity** | `users` | Single-role design — เก็บชื่อ, อีเมล, bcrypt password hash และ role (`admin` / `student` / `tutor`) พร้อม account lifecycle (`active` / `suspended` / `deleted`) |
| **Profile** | `student_profiles`, `tutor_profiles` | ข้อมูลเฉพาะทางแยกตาม role — นักเรียน: โรงเรียน, ระดับการศึกษา / ติวเตอร์: bio, ราคาค่าสอน, สถานะ verify (`pending` / `verified` / `rejected`) |
| **Tutor Details** | `tutor_experiences`, `tutor_subjects` | 4NF: แยก multi-value attribute ออกจาก tutor_profiles — `tutor_subjects` ใช้ Composite PK `(tutor_id, subject)` ป้องกันวิชาซ้ำ (BCNF) |
| **Post** | `student_posts` | กระดานประกาศหาติวเตอร์ — ระบุวิชา, ระดับ, รูปแบบการเรียน (`online` / `onsite` / `both`), สถานที่, เวลา, งบประมาณ และ moderation fields |
| **Job** | `applications` | ติวเตอร์สมัครงาน — Unique constraint `(post_id, tutor_id)` ป้องกัน apply ซ้ำ มี `teaching_status` (`not_started` / `ongoing` / `completed`) เพื่อ gate การเขียนรีวิว |
| **Schedule** | `tutor_schedules`, `schedule_bookings` | ตารางเวลาว่างของติวเตอร์ — `schedule_bookings` มี Unique constraint บน `schedule_id` ป้องกันการจองซ้ำ |
| **Review** | `reviews` | 3NF: อ้างอิงผ่าน `app_id` เท่านั้น — rating 1–5 พร้อม moderation fields (`is_hidden`, `moderation_reason`) |
| **Finance** | `payments` | 3NF: อ้างอิงผ่าน `app_id` — คำนวณ `platform_fee = amount × 10%` บังคับด้วย CHECK constraint, รองรับ slip verification |
| **Audit** | `user_action_logs` | Flexible audit trail สำหรับ admin — บันทึกทุก action บน user, post, review, payment พร้อม `performed_by` |

</details>

---

### วิธีการ Clone Project Using PowerShell

> ⚠️ ต้องติดตั้ง **Python 3.10+** และ **MySQL 9.6** ก่อนเริ่มต้น
> สามารถใช้ **MySQL Workbench** แทนการพิมพ์คำสั่งผ่าน PowerShell ก็ได้ ผลลัพธ์เหมือนกัน

```bash
# clone เฉพาะ branch Final ลงมาในโฟลเดอร์ชื่อ project
git clone -b Final https://github.com/Jupiter4428/Tutor-match.git project

# เข้าโฟลเดอร์โปรเจกต์
cd project

# สร้าง virtual environment ใหม่ (แนะนำให้ทำทุกครั้งที่ clone ใหม่)
python -m venv venv

# อนุญาตให้รัน script ใน PowerShell (ทำครั้งเดียวต่อเครื่อง)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# เปิดใช้งาน venv — prompt จะเปลี่ยนเป็น (venv) ด้านหน้า
.\venv\Scripts\activate

# ติดตั้ง library ทั้งหมดจาก requirements.txt
# ถ้าเพิ่ม library ใหม่ทีหลัง ให้รัน pip freeze > requirements.txt แล้ว commit ด้วย
pip install -r requirements.txt

# สร้างไฟล์ .env จาก template
copy .env.example .env
# ⚠️ เปิดไฟล์ .env แล้วแก้ค่าต่อไปนี้ให้ตรงกับเครื่องของตัวเอง:
#   DB_HOST     = localhost
#   DB_PORT     = 3306
#   DB_USER     = root
#   DB_PASSWORD = <รหัสผ่าน MySQL ของคุณ>
#   DB_NAME     = tutor_match
#   SECRET_KEY  = <สตริงยาวๆ สุ่มขึ้นมาเอง เช่น openssl rand -hex 32>
```

---

### Setup Database Using PowerShell

> ⚠️ ต้องทำขั้นตอนนี้ **ก่อนรัน server** และทำแค่ **ครั้งเดียว** (ถ้า drop database แล้วสร้างใหม่ค่อยทำซ้ำ)

```bash
# ทดสอบก่อนว่า MySQL อยู่ใน PATH หรือยัง
mysql --version
# ถ้าขึ้น "mysql  Ver 9.6.x ..." แสดงว่าพร้อมแล้ว ข้ามไปขั้นถัดไปได้เลย

# ถ้าไม่ขึ้น version ให้เพิ่ม PATH ชั่วคราวสำหรับ session นี้ก่อน
# (เปลี่ยน 9.6 เป็น version ที่ติดตั้งจริงในเครื่องถ้าต่างกัน)
$env:PATH += ";C:\Program Files\MySQL\MySQL Server 9.6\bin"

# ลองใหม่อีกครั้ง
mysql --version

# cd เข้าโปรเจค
cd project

# สร้าง Database (ถ้ามีอยู่แล้วจะข้ามไป ไม่มี error)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tutor_match CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# Enter password: <รหัสผ่าน MySQL ของคุณ>

# รัน schema.sql เพื่อสร้าง table ทั้งหมด (12 ตาราง)
# --default-character-set=utf8mb4 จำเป็นมากเพราะไฟล์มีภาษาไทย
cmd /c "mysql --default-character-set=utf8mb4 -u root -p tutor_match < database/schema.sql"
# Enter password: <รหัสผ่าน MySQL ของคุณ>

# (ไม่บังคับ) เพิ่มข้อมูลตัวอย่างสำหรับ dev/testing
cmd /c "mysql --default-character-set=utf8mb4 -u root -p tutor_match < database/seed.sql"
# Enter password: <รหัสผ่าน MySQL ของคุณ>
```

---

### Using Database in PowerShell

```bash
# เข้า MySQL shell
mysql -u root -p
# Enter password: <รหัสผ่าน MySQL ของคุณ>

# เลือก database ที่จะใช้งาน (ต้องทำทุกครั้งที่เข้า shell ใหม่)
USE tutor_match;

# ตัวอย่าง query ที่ใช้บ่อย
SELECT * FROM users;
SELECT * FROM tutor_profiles;
SELECT * FROM student_posts WHERE status = 'open';

# รัน .sql file จากภายนอก (PowerShell) โดยไม่ต้องเข้า shell
Get-Content database/seed.sql | mysql -u root -p tutor_match
# Enter password: <รหัสผ่าน MySQL ของคุณ>

# ออกจาก MySQL shell
EXIT;
```

---

### Some Script sql for testing in MySQL

```sql
-- ล้างข้อมูลทั้งหมดแต่คง table structure ไว้ (ใช้ตอน reset ข้อมูล dev)
-- ต้องปิด foreign key check ก่อนเพราะ table มี constraint ซึ่งกันและกัน
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_action_logs;
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
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- เพิ่ม admin user สำหรับ dev (รหัสผ่าน: 1234)
-- hash นี้เป็น bcrypt $2y$ format จาก PHP ซึ่ง backend รองรับแล้ว
USE tutor_match;
INSERT INTO users (name, email, password_hash, role, account_status)
VALUES (
    'superuser',
    'admin@tutormatch.com',
    '$2y$10$Wz/1MRBMFauEtGdJNeaKq.5INBmig0Nip2urekRON8ekLkYesdj6i',
    'admin',
    'active'
);
```

---

### Runserver

```bash
# ตรวจสอบก่อนว่า venv เปิดอยู่ (ต้องเห็น (venv) นำหน้า prompt)
# ถ้ายังไม่เปิดให้รัน: .\venv\Scripts\activate

# รัน Flask development server — เปิดที่ http://127.0.0.1:5000
python run.py

```

---

### ขั้นตอนการ push

```bash
# เช็คก่อนว่าตอนนี้อยู่ branch อะไร
git branch
# ต้องเห็น * demo — ถ้าไม่ใช่ให้สลับก่อน
git checkout Final

# pull ก่อนทุกครั้งเพื่อ sync code ล่าสุดจาก remote
# ป้องกัน conflict ที่ไม่จำเป็นตอน push
git pull origin Final

# ถ้าเจอ Merge Conflict หลัง pull ให้แก้ไฟล์นั้นก่อน
# หลังแก้เสร็จให้ mark ว่า resolved ด้วย git add
git add <ชื่อไฟล์ที่แก้ conflict>
git commit -m "resolve merge conflict in <ชื่อไฟล์>"

# ถ้าติดตั้ง library เพิ่มเติมในระหว่าง dev อย่าลืม update requirements.txt
pip freeze > requirements.txt
git add requirements.txt
git commit -m "update requirements.txt"

# add และ commit ทีละไฟล์ (แนะนำ) เพื่อให้ history อ่านง่าย
git add <ชื่อไฟล์>
git commit -m "อธิบายสั้นๆ ว่าแก้อะไร"

# ถ้ามีหลายไฟล์ที่เกี่ยวกันก็ add พร้อมกันแล้ว commit ครั้งเดียวได้
git add <ไฟล์1> <ไฟล์2>
git commit -m "อธิบายการเปลี่ยนแปลงที่เกี่ยวข้องกัน"

# push ขึ้น remote
git push origin Final
```
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
<td align="center"><b>Database & Backend developer & Backend Architect</b></td>
<td align="center">นายวุฒิศักดิ์ บุญกัน</td>
<td align="center">6710535029</td>
</tr>
<tr>
<td align="center"><b>Database</b></td>
<td align="center">[ชื่อของคุณ]</td>
<td align="center">6710615201</td>
</tr>
<tr>
<td align="center"><b>Frontend & UI/UX Design</b></td>
<td align="center">[ชื่อของคุณ]</td>
<td align="center">6710625010</td>
</tr>
</table>

<p align="right"><i>Project Version 1.0 | Updated: April 12, 2026</i></p>

