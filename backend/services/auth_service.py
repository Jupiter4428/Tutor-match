# auth_service.py
import bcrypt
import jwt
import datetime
from datetime import timezone

from backend.utils.db import get_connection
from backend.config import SECRET_KEY


def register_user(name, email, password, role):
    """ลงทะเบียนผู้ใช้งานใหม่"""
    default_pic = "static/uploads/default_profile.jpg"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # เช็ค email ซ้ำ
            cursor.execute(
                "SELECT user_id FROM users WHERE email = %s",
                (email,)
            )
            if cursor.fetchone():
                return {"status": "error", "message": "อีเมลนี้ถูกใช้งานแล้ว"}

            # hash password
            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), 
                bcrypt.gensalt()
            ).decode("utf-8")

            # กำหนดสถานะตาม role
            user_status = "pending" if role == "tutor" else "approved"

            # สร้าง user ในตาราง users
            cursor.execute(
                """
                INSERT INTO users
                (name, email, password_hash, role, status)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (name, email, password_hash, role, user_status)
            )

            # ดึง user_id ที่เพิ่งสร้าง
            user_id = cursor.lastrowid

            # สร้าง profile ตาม role
            if role == "student":
                cursor.execute(
                    """
                    INSERT INTO student_Profiles 
                    (user_id, profile_picture_url)
                    VALUES (%s, %s)
                    """,
                    (user_id, default_pic)
                )
            elif role == "tutor":
                cursor.execute(
                    """
                    INSERT INTO tutor_Profiles 
                    (user_id, hourly_rate, profile_picture_url)
                    VALUES (%s, %s, %s)
                    """,
                    (user_id, 1, default_pic)
                )      

            conn.commit()
            return {"status": "success", "message": "สมัครสมาชิกสำเร็จ", "data": None}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


def login_user(email, password):
    """เข้าสู่ระบบและสร้าง JWT token"""
    conn = get_connection()
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
                    status
                FROM users
                WHERE email = %s
                """,
                (email,)
            )
            user = cursor.fetchone()

            if not user:
                return {"status": "error", "message": "ไม่พบอีเมลนี้ในระบบ"}

            # เช็ค status
            if user["status"] == "banned":
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