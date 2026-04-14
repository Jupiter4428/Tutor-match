from backend.extensions import db
# เมื่อติวเตอร์กดปุ่ม "สมัครสอนโพสต์นี้" ทำหน้าที่บันทึกใบสมัครลงในระบบ
def apply_for_job(post_id, user_id): # เปลี่ยนจาก tutor_id เป็น user_id
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. ไปหา tutor_id ที่แท้จริงจาก user_id
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์ของคุณ (กรุณาสร้างโปรไฟล์ก่อน)"}

            actual_tutor_id = profile['tutor_id']

            # 2. เช็คว่าเคยสมัครไปหรือยัง (ป้องกันการสมัครซ้ำ)
            check_sql = "SELECT * FROM applications WHERE post_id = %s AND tutor_id = %s"
            cursor.execute(check_sql, (post_id, actual_tutor_id))
            if cursor.fetchone():
                return {"status": "error", "message": "คุณได้สมัครโพสต์นี้ไปแล้ว"}

            # 3. บันทึกการสมัคร
            sql = "INSERT INTO applications (post_id, tutor_id, status) VALUES (%s, %s, 'pending')"
            cursor.execute(sql, (post_id, actual_tutor_id))
            connection.commit()
            
            return {"status": "success", "message": "ส่งคำขอสมัครสอนเรียบร้อยแล้ว!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
# ดึงรายการ "ประกาศหาติวเตอร์" ของนักเรียนทั้งหมดที่ยังเปิดรับสมัครอยู่ เพื่อนำไปแสดงในหน้าฟีด
def get_open_posts():
    """ฟังก์ชันสำหรับดึงโพสต์ประกาศหาติวเตอร์ที่ยังเปิดรับอยู่ (open)"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # ดึงข้อมูลโพสต์ พร้อมเชื่อมไปเอาชื่อนักเรียนจากตาราง users
            sql = """
                SELECT 
                    p.post_id, 
                    p.subject, 
                    p.description, 
                    p.budget, 
                    p.created_at, 
                    u.name AS student_name
                FROM student_posts p
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE p.status = 'open'
                ORDER BY p.created_at DESC
            """
            cursor.execute(sql)
            posts = cursor.fetchall()
            
            return {
                "status": "success", 
                "message": "ดึงข้อมูลกระดานประกาศสำเร็จ",
                "data": posts
            }
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
# ดึงข้อมูล "ประวัติการสมัครสอน" ของติวเตอร์คนนั้นๆ เพื่อนำไปแสดงในหน้า Dashboard ของติวเตอร์
def get_tutor_applications(user_id):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. หา tutor_id จาก user_id ก่อน
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์", "data": []}

            # 2. ดึงประวัติการสมัคร โดย JOIN กับตารางโพสต์และนักเรียนเพื่อให้ได้ชื่อวิชาและชื่อนักเรียน
            sql = """
                SELECT 
                    a.app_id, a.status AS application_status, a.applied_at,
                    p.subject, u.name AS student_name
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE a.tutor_id = %s
                ORDER BY a.applied_at DESC
            """
            cursor.execute(sql, (profile['tutor_id'],))
            applications = cursor.fetchall()
            return {"status": "success", "data": applications}
    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
