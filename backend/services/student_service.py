# student_service.py
from backend.extensions import db

# สร้างประกาศหาติวเตอร์ใหม่ลงในระบบ
def create_student_post(user_id, subject, grade_level, learning_format, location, preferred_time, description, budget):
    connection = db.get_connection()
    try:

        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียนของคุณในระบบ"}

            cursor.execute("""
                INSERT INTO student_posts
                    (student_id, subject, grade_level, learning_format, location, preferred_time, description, budget, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'open')
            """, (profile['student_id'], subject, grade_level, learning_format, location, preferred_time, description, budget))
            connection.commit()

            return {"status": "success", "message": "ประกาศหาติวเตอร์สำเร็จแล้ว", "data": {"post_id": cursor.lastrowid}}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# จัดการสถานะใบสมัคร (ยอมรับ หรือ ปฏิเสธ)
def respond_to_application(app_id, user_id, action):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute("""
                SELECT a.app_id, p.post_id
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                WHERE a.app_id = %s AND p.student_id = %s
            """, (app_id, profile['student_id']))
            application = cursor.fetchone()

            if not application:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์จัดการใบสมัครนี้"}

            new_status = 'accepted' if action == 'accept' else 'rejected'
            cursor.execute("UPDATE applications SET status = %s WHERE app_id = %s", (new_status, app_id))

            if action == 'accept':
                cursor.execute("UPDATE student_posts SET status = 'closed' WHERE post_id = %s", (application['post_id'],))
                cursor.execute(
                    "UPDATE applications SET status = 'rejected' WHERE post_id = %s AND app_id != %s",
                    (application['post_id'], app_id)
                )

            connection.commit()
            return {"status": "success", "message": f"ดำเนินการ {new_status} เรียบร้อยแล้ว", "data": None}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายชื่อติวเตอร์ที่สมัครเข้ามาในโพสต์ที่ระบุ
def get_post_applications(post_id, user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            cursor.execute("SELECT student_id FROM student_posts WHERE post_id = %s", (post_id,))
            post = cursor.fetchone()
            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้", "data": []}
            if post['student_id'] != profile['student_id']:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์ดูข้อมูลโพสต์นี้", "data": []}

            cursor.execute("""
                SELECT
                    a.app_id, a.status AS application_status, a.applied_at,
                    a.teaching_status,
                    u.name AS tutor_name, tp.bio, tp.hourly_rate, tp.tutor_id,
                    p.status AS payment_status, p.amount AS payment_amount
                FROM applications a
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users u           ON tp.user_id  = u.user_id
                LEFT JOIN payments p   ON a.app_id    = p.app_id
                WHERE a.post_id = %s
                ORDER BY a.applied_at ASC
            """, (post_id,))

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": cursor.fetchall()}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ดูประวัติโพสต์ทั้งหมดของตัวเอง
def get_student_post_history(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน", "data": []}

            cursor.execute("""
                SELECT
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.description, p.budget,
                    p.status, p.created_at,
                    COUNT(a.app_id) AS applicant_count
                FROM student_posts p
                LEFT JOIN applications a ON p.post_id = a.post_id
                WHERE p.student_id = %s AND p.is_hidden = FALSE
                GROUP BY p.post_id
                ORDER BY p.created_at DESC
            """, (profile['student_id'],))

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": cursor.fetchall()}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()

def get_my_courses(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT student_id
                FROM student_profiles
                WHERE user_id = %s
            """, (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {
                    "status": "error",
                    "message": "ไม่พบโปรไฟล์นักเรียน",
                    "data": []
                }

            student_id = profile["student_id"]

            cursor.execute("""
                SELECT
                    a.app_id,
                    a.status AS application_status,
                    a.teaching_status,
                    a.applied_at,

                    sp.post_id,
                    sp.subject,
                    sp.description,
                    sp.budget,
                    sp.learning_format,
                    sp.location,
                    sp.preferred_time,

                    tp.tutor_id,
                    tp.bio AS tutor_bio,
                    tp.hourly_rate,
                    tp.profile_picture_url AS tutor_pic,
                    tp.verification_status AS tutor_status,

                    u.name AS tutor_name,
                    u.email AS tutor_email,

                    p.status AS payment_status,
                    p.amount AS payment_amount,

                    r.review_id,
                    r.rating,
                    r.comment AS review_comment,
                    r.created_at AS review_created_at,

                    (
                        SELECT GROUP_CONCAT(ts.subject SEPARATOR ', ')
                        FROM tutor_subjects ts
                        WHERE ts.tutor_id = tp.tutor_id
                    ) AS tutor_subjects,

                    (
                        SELECT GROUP_CONCAT(te.experience_detail SEPARATOR '||')
                        FROM tutor_experiences te
                        WHERE te.tutor_id = tp.tutor_id
                    ) AS tutor_experiences,

                    (
                        SELECT ROUND(AVG(r2.rating), 1)
                        FROM applications a2
                        JOIN reviews r2 ON r2.app_id = a2.app_id
                        WHERE a2.tutor_id = tp.tutor_id
                          AND r2.is_hidden = FALSE
                    ) AS tutor_average_rating,

                    (
                        SELECT COUNT(r3.review_id)
                        FROM applications a3
                        JOIN reviews r3 ON r3.app_id = a3.app_id
                        WHERE a3.tutor_id = tp.tutor_id
                          AND r3.is_hidden = FALSE
                    ) AS tutor_review_count

                FROM applications a
                JOIN student_posts sp ON a.post_id = sp.post_id
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users u ON tp.user_id = u.user_id
                LEFT JOIN payments p ON p.app_id = a.app_id
                LEFT JOIN reviews r ON r.app_id = a.app_id

                WHERE sp.student_id = %s
                  AND a.status = 'accepted'

                ORDER BY a.app_id DESC
            """, (student_id,))

            rows = cursor.fetchall()
            courses = []

            for row in rows:
                teaching_status = row.get("teaching_status")
                payment_status = row.get("payment_status")

                if teaching_status == "not_started":
                    status = "pending_payment"
                    status_text = "รอชำระเงิน"
                    progress = 0
                elif teaching_status == "ongoing":
                    status = "active"
                    status_text = "กำลังเรียน"
                    progress = 50
                elif teaching_status == "completed":
                    status = "completed"
                    status_text = "เรียนจบแล้ว"
                    progress = 100
                else:
                    status = "pending"
                    status_text = "รอยืนยัน"
                    progress = 10

                schedule_parts = []

                if row.get("preferred_time"):
                    schedule_parts.append(str(row["preferred_time"]))

                if row.get("location"):
                    schedule_parts.append(str(row["location"]))

                schedule = " / ".join(schedule_parts) if schedule_parts else "-"

                tutor_pic = row.get("tutor_pic")
                if not tutor_pic or str(tutor_pic).strip() == "":
                    tutor_pic = "/static/uploads/default_profile.jpg"

                tutor_subjects = []
                if row.get("tutor_subjects"):
                    tutor_subjects = [
                        subject.strip()
                        for subject in row["tutor_subjects"].split(",")
                        if subject.strip()
                    ]

                tutor_experiences = []
                if row.get("tutor_experiences"):
                    tutor_experiences = [
                        exp.strip()
                        for exp in row["tutor_experiences"].split("||")
                        if exp.strip()
                    ]

                courses.append({
    "id": row["app_id"],
    "app_id": row["app_id"],

    "subject": row.get("subject") or "-",
    "title": row.get("description") or row.get("subject") or "-",

    "status": status,
    "statusText": status_text,
    "teachingStatus": teaching_status,
    "paymentStatus": payment_status or "not_started",

    "price": float(row.get("payment_amount") or row.get("budget") or row.get("hourly_rate") or 0),
    "schedule": schedule,
    "format": row.get("learning_format") or "-",
    "progress": progress,

    # เพิ่มให้ frontend เรียกง่าย สำหรับกล่องโปรไฟล์ติวเตอร์ในการ์ด
    "tutor_id": row.get("tutor_id"),
    "tutor_name": row.get("tutor_name") or "-",
    "tutor_email": row.get("tutor_email") or "-",
    "tutor_bio": row.get("tutor_bio") or "-",
    "tutor_pic": tutor_pic,
    "tutor_hourly_rate": float(row.get("hourly_rate") or 0),
    "tutor_status": row.get("tutor_status") or "-",
    "tutor_subjects": tutor_subjects,
    "tutor_experiences": tutor_experiences,
    "tutor_average_rating": float(row.get("tutor_average_rating") or 0),
    "tutor_review_count": int(row.get("tutor_review_count") or 0),

    # เก็บแบบ nested ไว้ด้วย เผื่อ frontend ใช้ course.tutor.name
    "tutor": {
        "id": row.get("tutor_id"),
        "name": row.get("tutor_name") or "-",
        "email": row.get("tutor_email") or "-",
        "bio": row.get("tutor_bio") or "-",
        "pic": tutor_pic,
        "hourlyRate": float(row.get("hourly_rate") or 0),
        "verificationStatus": row.get("tutor_status") or "-",
        "subjects": tutor_subjects,
        "experiences": tutor_experiences,
        "averageRating": float(row.get("tutor_average_rating") or 0),
        "reviewCount": int(row.get("tutor_review_count") or 0)
    },

    "rating": row.get("rating"),
    "review": row.get("review_comment") or ""
})

            return {
                "status": "success",
                "message": "ดึงคอร์สของฉันสำเร็จ",
                "data": courses
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": []
        }
    finally:
        connection.close()
# อัปเดตข้อมูลโปรไฟล์ของนักเรียน
def update_student_profile(user_id, school_name, education_level):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            if not cursor.fetchone():
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute(
                "UPDATE student_profiles SET school_name = %s, education_level = %s WHERE user_id = %s",
                (school_name, education_level, user_id)
            )
            connection.commit()
            return {"status": "success", "message": "อัปเดตโปรไฟล์เรียบร้อยแล้ว", "data": None}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
        
# ลบโพสต์ของนักเรียนออกจากฐานข้อมูลถาวร (Hard Delete)
def delete_student_post(user_id, post_id):
    try:
        connection = db.get_connection()

        with connection.cursor() as cursor:
            # 1. เช็คสิทธิ์ความเป็นเจ้าของโพสต์ (Security Check)
            # ต้อง JOIN กับ student_profiles เพราะในมือเรามี user_id แต่ในตารางโพสต์เก็บ student_id
            cursor.execute("""
                SELECT p.post_id 
                FROM student_posts p
                JOIN student_profiles sp ON p.student_id = sp.student_id
                WHERE p.post_id = %s 
                AND sp.user_id = %s
            """, (post_id, user_id))

            post = cursor.fetchone()

            if not post:
                return {
                    "status": "error",
                    "message": "ไม่พบโพสต์นี้ หรือคุณไม่มีสิทธิ์ลบข้อมูลนี้"
                }

            # 2. คำสั่งลบข้อมูลถาวร
            # เนื่องจากมี ON DELETE CASCADE ใน Schema ข้อมูลในตาราง applications จะถูกลบตามอัตโนมัติ
            cursor.execute("""
                DELETE FROM student_posts 
                WHERE post_id = %s
            """, (post_id,))

            connection.commit()

            return {
                "status": "success",
                "message": "ลบข้อมูลออกจากระบบถาวรเรียบร้อยแล้ว"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        connection.close()
        
# ==========================================
# ระบบ Wallet สำหรับนักเรียน
# ==========================================

def get_student_wallet(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # 1. ค้นหากระเป๋าเงิน
            cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
            wallet = cursor.fetchone()
            
            # 2. ถ้ายังไม่มีกระเป๋า ให้สร้างใหม่ทันที (ยอด 0 บาท)
            if not wallet:
                cursor.execute("INSERT INTO wallets (user_id, balance, status) VALUES (%s, 0.00, 'active')", (user_id,))
                connection.commit()
                cursor.execute("SELECT * FROM wallets WHERE user_id = %s", (user_id,))
                wallet = cursor.fetchone()
                
            return {"status": "success", "data": wallet}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def get_wallet_transactions(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา wallet_id ก่อน
            cursor.execute("SELECT wallet_id FROM wallets WHERE user_id = %s", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "success", "data": []}
                
            cursor.execute("""
                SELECT transaction_id, transaction_type, amount, balance_after,
                       reference_type, reference_id, description,
                       DATE_FORMAT(transaction_date, '%%d %%b %%Y %%H:%%i') AS formatted_date
                FROM transaction_logs
                WHERE wallet_id = %s
                ORDER BY transaction_date DESC
            """, (wallet['wallet_id'],))
            
            return {"status": "success", "data": cursor.fetchall()}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def process_deposit(user_id, amount, note):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ดึงข้อมูล wallet ปัจจุบัน
            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "error", "message": "ไม่พบกระเป๋าเงิน"}

            new_balance = float(wallet['balance']) + float(amount)

            # อัปเดตยอดเงิน
            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))
            
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after, reference_type, description)
                VALUES (%s, 'deposit', %s, %s, 'deposit_slip', %s)
            """, (wallet['wallet_id'], amount, new_balance, note or 'ฝากเงินเข้า Wallet'))
            
            connection.commit()
            return {"status": "success", "message": "ฝากเงินสำเร็จ", "new_balance": new_balance}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def process_withdraw(user_id, amount, bank_name, account_number, note):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()

            if float(wallet['balance']) < float(amount):
                return {"status": "error", "message": "ยอดเงินคงเหลือไม่เพียงพอ"}

            new_balance = float(wallet['balance']) - float(amount)

            # อัปเดตยอดเงิน
            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))
            
            full_note = f"ถอนเข้า {bank_name} ({account_number})" + (f" • {note}" if note else "")
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after, reference_type, description)
                VALUES (%s, 'withdrawal', %s, %s, 'withdrawal_request', %s)
            """, (wallet['wallet_id'], amount, new_balance, full_note))
            
            connection.commit()
            return {"status": "success", "message": "แจ้งถอนเงินสำเร็จ", "new_balance": new_balance}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def submit_report(user_id, target_type, target_id, title, description):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reports (reporter_id, target_type, target_id, title, description, status)
                VALUES (%s, %s, %s, %s, %s, 'pending')
            """, (user_id, target_type, target_id, title, description))
            connection.commit()
            return {"status": "success", "message": "ส่งรายงานเรียบร้อยแล้ว"}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
