from backend.extensions import db

def create_student_post(student_id, subject, description, budget):
    """ฟังก์ชันสำหรับบันทึกประกาศหาติวเตอร์ลง Database"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # ใช้ตาราง student_posts
            sql = """
                INSERT INTO student_posts (student_id, subject, description, budget, status)
                VALUES (%s, %s, %s, %s, 'open')
            """
            cursor.execute(sql, (student_id, subject, description, budget))
            connection.commit()
            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def respond_to_application(app_id, student_id, action):
    """ฟังก์ชันสำหรับนักเรียนกดยอมรับ/ปฏิเสธติวเตอร์"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # 1. เช็คความปลอดภัย
            check_sql = """
                SELECT a.post_id, a.status, p.student_id 
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                WHERE a.app_id = %s
            """
            cursor.execute(check_sql, (app_id,))
            app_data = cursor.fetchone()

            if not app_data:
                return {"status": "error", "message": "ไม่พบใบสมัครนี้ในระบบ"}
            if app_data['student_id'] != student_id:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์จัดการใบสมัครนี้ (ไม่ใช่โพสต์ของคุณ)"}
            if app_data['status'] != 'pending':
                return {"status": "error", "message": "ใบสมัครนี้ถูกตัดสินไปแล้ว"}

            # 2. ทำการตัดสินใจตาม Action
            if action == 'accept':
                cursor.execute("UPDATE applications SET status = 'accepted' WHERE app_id = %s", (app_id,))
                cursor.execute("UPDATE student_posts SET status = 'closed' WHERE post_id = %s", (app_data['post_id'],))
                message = "ยอมรับติวเตอร์เรียบร้อย และปิดรับสมัครโพสต์นี้แล้ว!"
                
            elif action == 'reject':
                cursor.execute("UPDATE applications SET status = 'rejected' WHERE app_id = %s", (app_id,))
                message = "ปฏิเสธติวเตอร์เรียบร้อยแล้ว"
            else:
                return {"status": "error", "message": "คำสั่งไม่ถูกต้อง (ใช้ได้แค่ accept หรือ reject)"}

            connection.commit()
            return {"status": "success", "message": message}

    except Exception as e:
        return {"status": "error", "message": str(e)}