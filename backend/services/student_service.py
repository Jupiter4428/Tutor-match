from backend.extensions import db

# สร้างประกาศ
def create_student_post(user_id, subject, description, budget):
    """ฟังก์ชันสำหรับบันทึกประกาศ โดยรับ user_id แล้วไปแปลงเป็น student_id อัตโนมัติ"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ค้นหา student_id ที่ตรงกับ user_id ของคนที่ล็อกอินอยู่
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            # ถ้าไม่เจอโปรไฟล์นักเรียน (เช่น เป็นติวเตอร์หลงมา หรือยังไม่ได้สร้างโปรไฟล์)
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียนของคุณในระบบ"}

            # ดึง student_id ที่แท้จริงออกมา เพื่อใช้ในการสร้างโพสต์
            actual_student_id = profile['student_id']

            # 2. เอา student_id ที่ถูกต้องไปสร้างโพสต์
            sql = """
                INSERT INTO student_posts (student_id, subject, description, budget, status)
                VALUES (%s, %s, %s, %s, 'open')
            """
            cursor.execute(sql, (actual_student_id, subject, description, budget))
            connection.commit()
            
            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว!"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
# Logic การ "รับ/ปฏิเสธ" และ "ปิดโพสต์"
def respond_to_application(app_id, user_id, action): # เปลี่ยนจาก student_id เป็น user_id
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. แปลง user_id (จากหน้าบ้าน) เป็น student_id จริงๆ ก่อน
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            actual_student_id = profile['student_id']

            # 2. ตรวจสอบว่าใบสมัคร (app_id) นี้ เป็นของโพสต์ที่ "สมชาย" เป็นเจ้าของจริงไหม
            # (ป้องกันคนอื่นแอบมากด Accept งานที่ไม่ใช่ของตัวเอง)
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

            # 3. กำหนดสถานะใหม่
            new_status = 'accepted' if action == 'accept' else 'rejected'
            
            # อัปเดตสถานะของใบสมัครที่ถูกกด
            cursor.execute("UPDATE applications SET status = %s WHERE app_id = %s", (new_status, app_id))

            # 4. ถ้า "ยอมรับ" ให้ทำ 2 อย่างคือ: ปิดโพสต์ และ ปฏิเสธคนอื่น
            if action == 'accept':
                # ปิดโพสต์ประกาศนั้นทันที (Status = 'closed')
                cursor.execute("UPDATE student_posts SET status = 'closed' WHERE post_id = %s", (application['post_id'],))
                
                # เปลี่ยนสถานะใบสมัครอื่นๆ ในโพสต์เดียวกันเป็น rejected
                cursor.execute("UPDATE applications SET status = 'rejected' WHERE post_id = %s AND app_id != %s", (application['post_id'], app_id))

            connection.commit()
            return {"status": "success", "message": f"ดำเนินการ{new_status}เรียบร้อยแล้ว"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ดูรายชื่อคนสมัคร
def get_post_applications(post_id, user_id): # เปลี่ยนจาก student_id เป็น user_id
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. แปลง user_id ของสมชาย ให้เป็น student_id จริงๆ ก่อน
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            actual_student_id = profile['student_id']

            # 2. เช็คว่าสมชายคนนี้ เป็นเจ้าของโพสต์ post_id นี้จริงไหม
            cursor.execute("SELECT student_id FROM student_posts WHERE post_id = %s", (post_id,))
            post = cursor.fetchone()
            
            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้", "data": []}
            if post['student_id'] != actual_student_id:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์ดูข้อมูลโพสต์นี้", "data": []}

            # 3. ดึงรายชื่อติวเตอร์ที่สมัครเข้ามา
            sql = """
                SELECT 
                    a.app_id, a.status AS application_status, a.applied_at,
                    u.name AS tutor_name, tp.bio, tp.hourly_rate
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

# ดูประวัติโพสต์ของตัวเอง
def get_student_post_history(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ต้องหา student_id จาก user_id ก่อนเสมอ!
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            # 2. ดึงโพสต์โดยใช้ student_id ที่หาได้
            sql = """
                SELECT post_id, subject, description, budget, status, created_at 
                FROM student_posts 
                WHERE student_id = %s
                ORDER BY created_at DESC
            """
            cursor.execute(sql, (profile['student_id'],))
            posts = cursor.fetchall()
            
            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": posts}
    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
