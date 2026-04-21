# student_service.py
from backend.extensions import db

# สร้างประกาศหาติวเตอร์ใหม่ลงในระบบ
def create_student_post(user_id, subject, grade_level, learning_format, location, preferred_time, description, budget):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ค้นหา student_id ที่ตรงกับ user_id ของคนที่ล็อกอินอยู่
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            # 2. ตรวจสอบว่าพบโปรไฟล์นักเรียนหรือไม่
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียนของคุณในระบบ"}

            actual_student_id = profile['student_id']

            # 3. นำ student_id ไปสร้างโพสต์ใหม่พร้อม field ทั้งหมด
            sql = """
                INSERT INTO student_posts
                    (student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'open')
            """
            cursor.execute(sql, (
                actual_student_id, subject, grade_level,
                learning_format, location, preferred_time, description, budget
            ))
            connection.commit()

            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว", "post_id": cursor.lastrowid}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# จัดการสถานะใบสมัคร (ยอมรับ หรือ ปฏิเสธ)
def respond_to_application(app_id, user_id, action):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. แปลง user_id เป็น student_id เพื่อใช้ตรวจสอบสิทธิ์
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            actual_student_id = profile['student_id']

            # 2. ตรวจสอบว่าผู้ใช้งานเป็นเจ้าของโพสต์ที่ใบสมัครนี้เชื่อมโยงอยู่หรือไม่
            check_sql = """
                SELECT a.app_id, p.post_id
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                WHERE a.app_id = %s AND p.student_id = %s
            """
            cursor.execute(check_sql, (app_id, actual_student_id))
            application = cursor.fetchone()

            if not application:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์จัดการใบสมัครนี้"}

            # 3. กำหนดสถานะใหม่ตามที่ผู้ใช้งานเลือก
            new_status = 'accepted' if action == 'accept' else 'rejected'

            # 4. อัปเดตสถานะของใบสมัครที่ถูกเลือก
            cursor.execute("UPDATE applications SET status = %s WHERE app_id = %s", (new_status, app_id))

            # 5. กรณีที่ยอมรับใบสมัคร ให้ดำเนินการปิดโพสต์และปฏิเสธใบสมัครอื่นทั้งหมด
            if action == 'accept':
                cursor.execute("UPDATE student_posts SET status = 'closed' WHERE post_id = %s", (application['post_id'],))
                cursor.execute(
                    "UPDATE applications SET status = 'rejected' WHERE post_id = %s AND app_id != %s",
                    (application['post_id'], app_id)
                )

            connection.commit()
            return {"status": "success", "message": f"ดำเนินการ {new_status} เรียบร้อยแล้ว"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ดึงรายชื่อติวเตอร์ที่สมัครเข้ามาในโพสต์ที่ระบุ
def get_post_applications(post_id, user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ค้นหา student_id จาก user_id
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            actual_student_id = profile['student_id']

            # 2. ตรวจสอบสิทธิ์ว่าผู้เรียกดูเป็นเจ้าของโพสต์นี้หรือไม่
            cursor.execute("SELECT student_id FROM student_posts WHERE post_id = %s", (post_id,))
            post = cursor.fetchone()

            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้", "data": []}
            if post['student_id'] != actual_student_id:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์ดูข้อมูลโพสต์นี้", "data": []}

            # 3. ดึงข้อมูลใบสมัครและข้อมูลส่วนตัวของติวเตอร์
            sql = """
                SELECT
                    a.app_id, a.status AS application_status, a.applied_at,
                    u.name AS tutor_name, tp.bio, tp.hourly_rate, tp.tutor_id
                FROM applications a
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users u ON tp.user_id = u.user_id
                WHERE a.post_id = %s
                ORDER BY a.applied_at ASC
            """
            cursor.execute(sql, (post_id,))
            applications = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": applications}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}


# ดูประวัติโพสต์ทั้งหมดของตัวเอง
def get_student_post_history(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ค้นหา student_id จาก user_id
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            # 2. ดึงประวัติโพสต์พร้อม field ใหม่ทั้งหมด และนับจำนวน applicants
            sql = """
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
            """
            cursor.execute(sql, (profile['student_id'],))
            posts = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": posts}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}


# อัปเดตข้อมูลโปรไฟล์ของนักเรียน
def update_student_profile(user_id, school_name, education_level):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ตรวจสอบว่ามีโปรไฟล์นี้อยู่ในระบบหรือไม่ก่อนทำการอัปเดต
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            # 2. อัปเดตข้อมูลการศึกษาในตาราง student_profiles โดยอ้างอิงจาก user_id
            sql = """
                UPDATE student_profiles
                SET school_name = %s, education_level = %s
                WHERE user_id = %s
            """
            cursor.execute(sql, (school_name, education_level, user_id))
            connection.commit()

            return {"status": "success", "message": "อัปเดตโปรไฟล์เรียบร้อยแล้ว"}

    except Exception as e:
        return {"status": "error", "message": str(e)}