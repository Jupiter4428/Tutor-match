from backend.extensions import db

def create_student_post(student_id, subject, description, budget):
    """ฟังก์ชันสำหรับบันทึกประกาศหาติวเตอร์ลง Database"""
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # ใช้ SQL ที่รองรับภาษาไทยที่เราเซ็ตไว้
            sql = """
                INSERT INTO student_posts (student_id, subject, description, budget, status)
                VALUES (%s, %s, %s, %s, 'open')
            """
            cursor.execute(sql, (student_id, subject, description, budget))
            connection.commit()
            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}