<div align="center">
  <h1>🎓 Tutor Match Platform</h1>
  <p><b>ระบบสื่อกลางการจับคู่ระหว่างนักเรียนและติวเตอร์ (CN230 Project)</b></p>

  <img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.1.3-green?style=for-the-badge&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-Connector-orange?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status">
</div>

---

### 📖 ภาพรวมของระบบ (System Overview)
แพลตฟอร์มที่เชื่อมต่อระหว่าง **นักเรียน** และ **ติวเตอร์** โดยเน้นความน่าเชื่อถือผ่านระบบยืนยันตัวตนและรีวิวที่ออกแบบตามหลักฐานข้อมูลที่ถูกต้อง

---

### 🗄️ โครงสร้างฐานข้อมูล (Database Schema)
ระบบผ่านการทำ **Normalization (3NF, BCNF, 4NF)** เพื่อลดความซ้ำซ้อนและรองรับความปลอดภัย

<details>
<summary><b>🔎 คลิกเพื่อดูรายละเอียด 13 ตาราง</b></summary>

| หมวดหมู่ | รายชื่อตาราง (Tables) | รายละเอียดตามหลัก Normalization |
| :--- | :--- | :--- |
| **Identity** | `User`, `User_Role` | ระบบบัญชีผู้ใช้: เก็บข้อมูลพื้นฐาน (ชื่อ, อีเมล, รหัสผ่าน) และกำหนดสิทธิ์ว่าใครเป็น "นักเรียน" หรือ "ติวเตอร์" |
| **Profile** | `Student_Profile`, `Tutor_Profile` | ข้อมูลส่วนตัว: เก็บรายละเอียดเฉพาะทาง เช่น นักเรียนอยู่ชั้นไหน/โรงเรียนอะไร และติวเตอร์มีประวัติย่อ (Bio) พร้อมราคาค่าสอนเท่าไหร่ |
| **Post** | `Student_Post` | กระดานประกาศ: พื้นที่ให้นักเรียนลงประกาศหาติวเตอร์ โดยระบุวิชาที่อยากเรียน รายละเอียด และงบประมาณที่มี |
| **Job** | `Application`, `Schedule_Booking` | ระบบสมัครและจองตัว: ใช้บันทึกว่าติวเตอร์คนไหนสมัครสอนในโพสต์ไหนบ้าง และเมื่อตกลงกันได้แล้วจะใช้จองวัน-เวลาเรียนเพื่อไม่ให้คิวชนกัน |
| **Review** | `Review` | ระบบประเมิน: ให้นักเรียนให้คะแนน (Rating) และเขียนคำชม/ข้อเสนอแนะหลังจากเรียนจบ เพื่อสร้างความน่าเชื่อถือให้ติวเตอร์ |
| **Finance** | `Payment` | ระบบการเงิน: บันทึกยอดชำระเงินจากนักเรียน คํานวณค่าธรรมเนียมระบบ และติดตามสถานะว่าจ่ายเงินเรียบร้อยแล้วหรือยัง |
| **Details** | `Tutor_Experience`, `Tutor_Subject`, `Tutor_Certificate` | แฟ้มผลงานติวเตอร์: เก็บข้อมูลเสริมที่ช่วยในการตัดสินใจ เช่น ประสบการณ์ที่เคยสอนมา, รายชื่อวิชาที่ถนัดทั้งหมด และใบเซอร์ฯ ต่างๆ |

</details>

---

### วิธีการ clone project

```bash
# git clone
git clone -b renovate https://github.com/Jupiter4428/Tutor-match.git Tutor_match

# สร้าง venv ใหม่
python -m venv venv

# เปิดใช้งาน
.\venv\Scripts\activate

# ติดตั้ง Library 
pip install -r requirements.txt

```
### ****** อย่าลืมใส่รหัส MySQL ของคุณในไฟล์ .env ******
### Setup Database Using PowerShell

```bash
# ผ่าน PowerShell using MySql version 9.6
# ทดสอบก่อนว่ามี PATH MySql ในเครื่องหรือยัง
mysql --version
# ถ้าไม่ขึ้น version ให้เพิ่ม PATH ก่อน

# เพิ่ม PATH ให้ถูก version (ถ้ายังไม่มี PATH)
$env:PATH += ";C:\Program Files\MySQL\MySQL Server 9.6\bin"

# ทดสอบ
mysql --version
# ถ้าขึ้น version ไปต่อ

# เข้าโฟล์เดอร์โปรเจคก่อน
cd Tutor_match

# สร้าง Database ก่อน
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tutor_match;"

# รัน Schema
Get-Content database/schema.sql | mysql -u root -p tutor_match
```
### Runserver
```bash
# ไปที่โฟลเดอร์โปรเจกต์
cd Tutor_match

# รัน server
python run.py
```
### ขั้นตอนการ push

```bash
# ไปที่โฟลเดอร์โปรเจกต์
cd Tutor_match

# หากมีการติดตั้ง library เพิ่มเติม
pip freeze > requirements.txt

# ถ้าอยากสร้าง Branch ใหม่
git checkout -b <ชื่อ-branch-ใหม่>

# เช็คก่อนว่าตอนนี้อยู่ Branch ไหน
git branch

# หากขึ้นว่าอยู่ Branch อื่นที่ไม่ใช่ Branch นี้ก็สลับ Branch
git checkout renovate

# add file & commit ตามปกติ
git add <ชื่อไฟล์>
git commit -m "commit comments"

# git pull ก่อนเสมอ (update code)
git pull origin renovate

# หากเจอ Merge Conflict ก็แก้ไฟล์นั้นก่อน แล้วค่อย add & commit ทีละไฟล์
git add <ชื่อไฟล์>
git commit -m "Resolve merge conflict in <ชื่อไฟล์>"

# gitpush
git push origin renovate
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

<p align="right"><i>Project Version 1.0 | Updated: April 7, 2026</i></p>

