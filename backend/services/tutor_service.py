# tutor_service.py
from backend.extensions import db


# ดึงโพสต์ที่เปิดรับสมัครทั้งหมด (สำหรับติวเตอร์เลือกงาน)
def get_open_posts(subject_filter=None):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            sql = """
                SELECT
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.description, p.budget,
                    p.created_at,
                    u.name AS student_name
                FROM student_posts p
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE p.status = 'open' AND p.is_hidden = FALSE
            """
            params = []

            # กรองตามวิชาถ้าส่ง filter มา
            if subject_filter:
                sql += " AND p.subject LIKE %s"
                params.append(f"%{subject_filter}%")

            sql += " ORDER BY p.created_at DESC"

            cursor.execute(sql, params)
            posts = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": posts}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}


# ติวเตอร์สมัครรับงานจากโพสต์
def apply_to_post(user_id, post_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. แปลง user_id → tutor_id
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์ของคุณในระบบ"}

            tutor_id = profile['tutor_id']

            # 2. ตรวจสอบว่าโพสต์นั้นยังเปิดรับอยู่หรือไม่
            cursor.execute("SELECT status FROM student_posts WHERE post_id = %s AND is_hidden = FALSE", (post_id,))
            post = cursor.fetchone()
            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้ในระบบ"}
            if post['status'] != 'open':
                return {"status": "error", "message": "โพสต์นี้ปิดรับสมัครแล้ว"}

            # 3. ตรวจสอบว่าเคยสมัครโพสต์นี้ไปแล้วหรือยัง
            cursor.execute(
                "SELECT app_id FROM applications WHERE post_id = %s AND tutor_id = %s",
                (post_id, tutor_id)
            )
            if cursor.fetchone():
                return {"status": "error", "message": "คุณได้สมัครโพสต์นี้ไปแล้ว"}

            # 4. สร้างใบสมัครใหม่ สถานะเริ่มต้น = pending
            cursor.execute(
                "INSERT INTO applications (post_id, tutor_id, status) VALUES (%s, %s, 'pending')",
                (post_id, tutor_id)
            )
            connection.commit()

            return {"status": "success", "message": "สมัครงานสำเร็จแล้ว รอการยืนยันจากนักเรียน", "app_id": cursor.lastrowid}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ดูรายการใบสมัครทั้งหมดที่ติวเตอร์ส่งไป (พร้อมสถานะ)
def get_tutor_applications(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. แปลง user_id → tutor_id
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์", "data": []}

            tutor_id = profile['tutor_id']

            # 2. ดึงใบสมัครพร้อมข้อมูลโพสต์ที่เกี่ยวข้อง
            sql = """
                SELECT
                    a.app_id, a.status AS application_status, a.applied_at,
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.budget,
                    u.name AS student_name
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE a.tutor_id = %s
                ORDER BY a.applied_at DESC
            """
            cursor.execute(sql, (tutor_id,))
            applications = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": applications}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}


# ดึงข้อมูลสรุปสำหรับ Dashboard ของติวเตอร์
def get_tutor_dashboard_stats(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์"}

            tutor_id = profile['tutor_id']

            # จำนวนงานที่รับแล้ว (accepted)
            cursor.execute(
                "SELECT COUNT(*) AS cnt FROM applications WHERE tutor_id = %s AND status = 'accepted'",
                (tutor_id,)
            )
            teaching_now = cursor.fetchone()['cnt']

            # จำนวนงานที่เปิดรับอยู่ในระบบ
            cursor.execute("SELECT COUNT(*) AS cnt FROM student_posts WHERE status = 'open' AND is_hidden = FALSE")
            available_jobs = cursor.fetchone()['cnt']

            # รายได้เดือนนี้ — SUM budget จาก accepted applications ในเดือนปัจจุบัน
            cursor.execute("""
                SELECT COALESCE(SUM(p.budget), 0) AS monthly_income
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                WHERE a.tutor_id = %s
                  AND a.status = 'accepted'
                  AND MONTH(a.applied_at) = MONTH(CURDATE())
                  AND YEAR(a.applied_at)  = YEAR(CURDATE())
            """, (tutor_id,))
            monthly_income = float(cursor.fetchone()['monthly_income'])

            # คะแนนเฉลี่ยจาก reviews (JOIN ผ่าน applications)
            avg_rating = 0.0
            try:
                cursor.execute("""
                    SELECT AVG(r.rating) AS avg_rating
                    FROM reviews r
                    JOIN applications a ON r.app_id = a.app_id
                    WHERE a.tutor_id = %s
                """, (tutor_id,))
                row = cursor.fetchone()
                avg_rating = round(float(row['avg_rating'] or 0), 1)
            except Exception:
                pass  # ถ้าไม่มีตาราง reviews ก็ข้ามไป

            return {
                "status": "success",
                "data": {
                    "available_jobs": available_jobs,
                    "teaching_now": teaching_now,
                    "monthly_income": monthly_income,
                    "avg_rating": avg_rating,
                }
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ดึงตารางสอนของติวเตอร์ (applications ที่ได้รับการ accept แล้ว)
def get_tutor_schedule(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # แปลง user_id → tutor_id
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์", "data": []}

            tutor_id = profile['tutor_id']

            # ดึง applications ที่ status = accepted พร้อมรายละเอียดโพสต์
            sql = """
                SELECT
                    a.app_id,
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
                WHERE a.tutor_id = %s AND a.status = 'accepted'
                ORDER BY a.applied_at DESC
            """
            cursor.execute(sql, (tutor_id,))
            schedule = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": schedule}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    
# Tutor Profile
# =========================

def get_tutor_profile(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            sql = """
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
                WHERE tp.user_id = %s
            """
            cursor.execute(sql, (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {
                    "status": "error",
                    "message": "ไม่พบโปรไฟล์ติวเตอร์"
                }

            return {
                "status": "success",
                "data": profile
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


def update_tutor_profile(user_id, bio, hourly_rate, filename=None):
    try:
        connection = db.get_connection()

        with connection.cursor() as cursor:

            if filename:
                sql = """
                    UPDATE tutor_profiles
                    SET bio=%s,
                        hourly_rate=%s,
                        profile_picture_url=%s
                    WHERE user_id=%s
                """

                cursor.execute(sql, (
                    bio,
                    hourly_rate,
                    f"static/uploads/{filename}",
                    user_id
                ))

            else:
                sql = """
                    UPDATE tutor_profiles
                    SET bio=%s,
                        hourly_rate=%s
                    WHERE user_id=%s
                """

                cursor.execute(sql, (
                    bio,
                    hourly_rate,
                    user_id
                ))

            connection.commit()

            return {
                "status": "success",
                "message": "อัปเดตสำเร็จ"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }