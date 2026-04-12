import bcrypt
import jwt
import datetime
from backend.utils.db import get_connection
from backend.config import SECRET_KEY

def register_user(name, email, password, role):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # เช็ค email ซ้ำ
            cursor.execute("SELECT user_id FROM Users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {"status": "error", "message": "อีเมลนี้ถูกใช้งานแล้ว"}

            # hash password
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # สร้าง user
            cursor.execute(
                "INSERT INTO Users (name, email, password_hash) VALUES (%s, %s, %s)",
                (name, email, password_hash)
            )
            user_id = cursor.lastrowid

            # กำหนด role
            cursor.execute(
                "INSERT INTO User_Roles (user_id, role) VALUES (%s, %s)",
                (user_id, role)
            )

            # สร้าง profile ตาม role
            if role == "student":
                cursor.execute(
                    "INSERT INTO Student_Profiles (user_id) VALUES (%s)",
                    (user_id,)
                )
            elif role == "tutor":
                cursor.execute(
                    "INSERT INTO Tutor_Profiles (user_id, hourly_rate) VALUES (%s, %s)",
                    (user_id, 0)
                )

            conn.commit()
            return {"status": "success", "message": "สมัครสมาชิกสำเร็จ"}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


def login_user(email, password):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # หา user จาก email
            cursor.execute(
                "SELECT user_id, name, email, password_hash FROM Users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()

            if not user:
                return {"status": "error", "message": "ไม่พบอีเมลนี้ในระบบ"}

            # เช็ค password
            if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
                return {"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}

            # ดึง role
            cursor.execute(
                "SELECT role FROM User_Roles WHERE user_id = %s",
                (user["user_id"],)
            )
            roles = [r["role"] for r in cursor.fetchall()]

            # สร้าง JWT token
            token = jwt.encode({
                "user_id": user["user_id"],
                "role": roles[0],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }, SECRET_KEY, algorithm="HS256")

            return {
                "status": "success",
                "message": "เข้าสู่ระบบสำเร็จ",
                "token": token,
                "user": {
                    "user_id": user["user_id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": roles[0]
                }
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()