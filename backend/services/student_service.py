# student_service.py
from backend.extensions import db

# สร้างประกาศหาติวเตอร์ใหม่ลงในระบบ
def create_student_post(user_id, subject, grade_level, learning_format, location, preferred_time, description, budget):
    connection = db.get_connection()
    try:

        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียนของคุณในระบบ"}

            cursor.execute("""
                INSERT INTO student_posts
                    (student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'open')
            """, (profile['student_id'], subject, grade_level, learning_format, location, preferred_time, description, budget))
            connection.commit()

            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว", "data": {"post_id": cursor.lastrowid}}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# จัดการสถานะใบสมัคร (ยอมรับ หรือ ปฏิเสธ)
def respond_to_application(app_id, user_id, action):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute("""
                SELECT a.app_id, p.post_id
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                WHERE a.app_id = %s AND p.student_id = %s
            """, (app_id, profile['student_id']))
            application = cursor.fetchone()

            if not application:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์จัดการใบสมัครนี้"}

            new_status = 'accepted' if action == 'accept' else 'rejected'
            cursor.execute("UPDATE applications SET status = %s WHERE app_id = %s", (new_status, app_id))

            if action == 'accept':
                cursor.execute("UPDATE student_posts SET status = 'closed' WHERE post_id = %s", (application['post_id'],))
                cursor.execute(
                    "UPDATE applications SET status = 'rejected' WHERE post_id = %s AND app_id != %s",
                    (application['post_id'], app_id)
                )

            connection.commit()
            return {"status": "success", "message": f"ดำเนินการ {new_status} เรียบร้อยแล้ว", "data": None}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายชื่อติวเตอร์ที่สมัครเข้ามาในโพสต์ที่ระบุ
def get_post_applications(post_id, user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            cursor.execute("SELECT student_id FROM student_posts WHERE post_id = %s", (post_id,))
            post = cursor.fetchone()
            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้", "data": []}
            if post['student_id'] != profile['student_id']:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์ดูข้อมูลโพสต์นี้", "data": []}

            cursor.execute("""
                SELECT
                    a.app_id, a.status AS application_status, a.applied_at,
                    u.name AS tutor_name, tp.bio, tp.hourly_rate, tp.tutor_id
                FROM applications a
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users u ON tp.user_id = u.user_id
                WHERE a.post_id = %s
                ORDER BY a.applied_at ASC
            """, (post_id,))

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": cursor.fetchall()}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ดูประวัติโพสต์ทั้งหมดของตัวเอง
def get_student_post_history(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            cursor.execute("""
                SELECT
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.description, p.budget,
                    p.status, p.created_at,
                    COUNT(a.app_id) AS applicant_count
                FROM student_posts p
                LEFT JOIN applications a ON p.post_id = a.post_id
                WHERE p.student_id = %s AND p.is_hidden = FALSE
                GROUP BY p.post_id
                ORDER BY p.created_at DESC
            """, (profile['student_id'],))

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": cursor.fetchall()}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# อัปเดตข้อมูลโปรไฟล์ของนักเรียน
def update_student_profile(user_id, school_name, education_level):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute(
                "UPDATE student_profiles SET school_name = %s, education_level = %s WHERE user_id = %s",
                (school_name, education_level, user_id)
            )
            connection.commit()
            return {"status": "success", "message": "อัปเดตโปรไฟล์เรียบร้อยแล้ว", "data": None}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()