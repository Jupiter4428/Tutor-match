# backend/services/admin_service.py
from backend.utils.db import get_connection

def get_all_users_data():
    """
    ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้งานทั้งหมดจากฐานข้อมูล
    """
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute("""
                SELECT user_id as id, name, email, role, account_status as status, created_at as createdAt
                FROM users
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()

            for user in users:
                if user['createdAt']:
                    user['createdAt'] = user['createdAt'].strftime('%Y-%m-%d')

            return {
                "status": "success",
                "users": users
            }

    except Exception as e:
        return {
            "status": "error", 
            "message": str(e)
        }
    finally:
        conn.close()