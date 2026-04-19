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
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {"status": "error", "message": "อีเมลนี้ถูกใช้งานแล้ว"}

            # hash password
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # สร้าง user
            cursor.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
                (name, email, password_hash)
            )
            user_id = cursor.lastrowid

            # กำหนด role
            cursor.execute(
                "INSERT INTO user_Roles (user_id, role) VALUES (%s, %s)",
                (user_id, role)
            )

            # สร้าง profile ตาม role
            if role == "student":
                cursor.execute(
                    "INSERT INTO student_Profiles (user_id) VALUES (%s)",
                    (user_id,)
                )
            elif role == "tutor":
                cursor.execute(
                    "INSERT INTO tutor_Profiles (user_id, hourly_rate) VALUES (%s, %s)",
                    (user_id, 0)
                )

            conn.commit()
            return {"status": "success", "message": "สมัครสมาชิกสำเร็จ"}

    except Exception as e:
        conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


import datetime
import jwt
# from backend.extensions import db  (นำเข้า db จามที่ได้ตั้งค่าไว้ใน extensions.py)
# SECRET_KEY = "your_secret_key" (อย่าลืมตั้งค่า SECRET_KEY )

def login_user(email, password):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. หา user จาก email (เพิ่มการดึงคอลัมน์ role มาพร้อมกันเลย)
            cursor.execute(
                "SELECT user_id, name, email, password_hash, role FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()

            if not user:
                return {"status": "error", "message": "ไม่พบอีเมลนี้ในระบบ"}

            # 2. เช็ค password
            db_password = user["password_hash"]
            
            # เพิ่ม $2y$ เข้าไปในเงื่อนไข เพื่อให้ระบบรู้จัก Hash ตัวนี้
            if db_password.startswith(("$2b$", "$2a$", "$2y$")):
                # แปลง Hash ก่อนตรวจเช็ค (บางเวอร์ชันของ bcrypt ใน Python ต้องการ $2b$)
                if db_password.startswith("$2y$"):
                    db_password = db_password.replace("$2y$", "$2b$", 1)

                if not bcrypt.checkpw(password.encode("utf-8"), db_password.encode("utf-8")):
                    return {"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}
            else:
                # กรณีเป็น User เก่าที่ยังไม่ได้เข้ารหัส (เช่น สมชาย 1234)
                if db_password != password:
                    return {"status": "error", "message": "รหัสผ่านไม่ถูกต้อง"}

            # 3. ดึง role จาก user ได้เลย ไม่ต้อง Query ใหม่แล้ว
            user_role = user["role"]

            # 4. สร้าง JWT token
            token = jwt.encode({
                "user_id": user["user_id"],
                "role": user_role,
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
                    "role": user_role
                }
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()