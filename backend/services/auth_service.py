# auth_service.py
import bcrypt
import jwt
import datetime
from datetime import timezone

from backend.config import SECRET_KEY
from backend.extensions import db

def register_user(name, email, password, role):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ตรวจสอบอีเมลซ้ำก่อน
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {"status": "error", "message": "อีเมลนี้ถูกใช้งานแล้ว"}

            # ทำการ Hash รหัสผ่าน (ใช้ library เช่น bcrypt หรือ werkzeug)
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # บันทึกลงตาราง users (ไม่ต้องใส่ account_status เพราะมี DEFAULT 'active' อยู่แล้ว)
            # ลำดับคอลัมน์: name, email, password_hash, role
            sql = "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (name, email, password_hash, role))
            
            user_id = cursor.lastrowid
            
            # สร้าง Profile ตาม Role (เพื่อป้องกัน Error เวลาเข้าหน้า Profile)
            if role == 'student':
                cursor.execute("INSERT INTO student_profiles (user_id) VALUES (%s)", (user_id,))
            elif role == 'tutor':
                # หน้า Tutor ต้องมีค่าเริ่มต้นสำหรับ hourly_rate และ profile_picture_url ตาม Schema
                cursor.execute("""
                    INSERT INTO tutor_profiles (user_id, hourly_rate, profile_picture_url)
                    VALUES (%s, 0.00, 'static/uploads/default_profile.jpg')
                """, (user_id,))
            
            # สร้าง Wallet ให้ user ใหม่ด้วย
            cursor.execute("INSERT INTO wallets (user_id, balance) VALUES (%s, 0.00)", (user_id,))

            connection.commit()
            return {"status": "success", "message": "สมัครสมาชิกสำเร็จ"}
            
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def login_user(email, password):
    """เข้าสู่ระบบและสร้าง JWT token"""
    conn = db.get_connection()
    try:
        with conn.cursor() as cursor:
            # หา user จาก email
            cursor.execute(
                """
                SELECT
                    user_id,
                    name,
                    email,
                    password_hash,
                    role,
                    account_status
                FROM users
                WHERE email = %s
                """,
                (email,)
            )
            user = cursor.fetchone()

            if not user:
                return {"status": "error", "message": "ไม่พบอีเมลนี้ในระบบ"}

            if user["account_status"] in ("ban", "suspended"):
                return {"status": "error", "message": "บัญชีนี้ถูกระงับการใช้งาน"}

            # เช็ค password
            db_password = user["password_hash"]

            # รองรับ hash prefix $2y$ จาก PHP bcrypt
            if db_password.startswith("$2y$"):
                db_password = db_password.replace("$2y$", "$2b$", 1)

            if not db_password.startswith(("$2b$", "$2a$")):
                return {"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}

            if not bcrypt.checkpw(password.encode("utf-8"), db_password.encode("utf-8")):
                return {"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}

            # สร้าง JWT token
            user_role = user["role"]
            token = jwt.encode(
                {
                    "user_id": user["user_id"],
                    "role": user_role,
                    "exp": datetime.datetime.now(timezone.utc) + datetime.timedelta(days=1)
                },
                SECRET_KEY,
                algorithm="HS256"
            )

            return {
                "status": "success",
                "message": "เข้าสู่ระบบสำเร็จ",
                "token": token,
                "user": {
                    "user_id": user["user_id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user_role
                }
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()