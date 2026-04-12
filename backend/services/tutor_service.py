from backend.extensions import db

def apply_for_job(post_id, tutor_id):
    """ฟังก์ชันสำหรับติวเตอร์กดสมัครสอน (Apply)"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # ตรวจสอบก่อนว่าโพสต์นี้ยังเปิดรับอยู่ไหม (status = 'open')
            check_sql = "SELECT status FROM student_posts WHERE post_id = %s"
            cursor.execute(check_sql, (post_id,))
            post = cursor.fetchone()

            if not post:
                return {"status": "error", "message": "ไม่พบประกาศหาติวเตอร์นี้"}
            if post['status'] != 'open':
                return {"status": "error", "message": "ประกาศนี้ปิดรับสมัครไปแล้ว"}

            # บันทึกการสมัครลงตาราง Application
            insert_sql = """
                INSERT INTO applications (post_id, tutor_id, status)
                VALUES (%s, %s, 'pending')
            """
            cursor.execute(insert_sql, (post_id, tutor_id))
            connection.commit()
            
            return {"status": "success", "message": "ส่งคำขอสมัครสอนเรียบร้อยแล้ว!"}
            
    except Exception as e:
        # ดักจับ Error กรณีสมัครซ้ำ (เพราะเราตั้ง UNIQUE ไว้ใน DB)
        if "Duplicate entry" in str(e):
            return {"status": "error", "message": "คุณได้สมัครสอนโพสต์นี้ไปแล้ว"}
        return {"status": "error", "message": str(e)}