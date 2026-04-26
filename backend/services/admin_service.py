# admin_service.py
from backend.extensions import db


# ดึงสถิติภาพรวมของระบบ
def get_admin_stats():
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # นับผู้ใช้ทั้งหมด
            cursor.execute("SELECT COUNT(*) as total FROM users")
            total_users = cursor.fetchone()["total"]

            # นับเฉพาะ student
            cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'student'")
            students = cursor.fetchone()["total"]

            # นับเฉพาะ tutor
            cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'tutor'")
            tutors = cursor.fetchone()["total"]

            # นับโพสต์หาติวเตอร์ทั้งหมด
            cursor.execute("SELECT COUNT(*) as total FROM student_posts")
            posts = cursor.fetchone()["total"]

            # นับ tutor ที่รอ verify (pending อยู่ใน tutor_profiles ไม่ใช่ users)
            cursor.execute("SELECT COUNT(*) as total FROM tutor_profiles WHERE verification_status = 'pending'")
            pending = cursor.fetchone()["total"]

            # นับผู้ใช้ที่ถูก ban หรือ suspended
            cursor.execute("SELECT COUNT(*) as total FROM users WHERE account_status IN ('ban', 'suspended')")
            banned = cursor.fetchone()["total"]

            # นับรายงานที่ยังไม่ได้ดำเนินการ
            cursor.execute("SELECT COUNT(*) as total FROM reports WHERE status = 'pending'")
            reports = cursor.fetchone()["total"]

        return {
            "status": "success",
            "data": {
                "total_users": total_users,
                "students": students,
                "tutors": tutors,
                "posts": posts,
                "reports": reports,
                "pending": pending,
                "banned": banned
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายชื่อผู้ใช้ทั้งหมด พร้อมข้อมูล tutor_profiles (ถ้ามี)
def get_all_users():
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # LEFT JOIN tutor_profiles เพื่อดึง profile_picture_url และ verification_status สำหรับ tutor
            cursor.execute("""
                SELECT
                    u.user_id as id,
                    u.name,
                    u.email,
                    u.role,
                    u.account_status as status,
                    u.created_at as createdAt,
                    tp.profile_picture_url,
                    tp.verification_status
                FROM users u
                LEFT JOIN tutor_profiles tp ON tp.user_id = u.user_id
                ORDER BY u.created_at DESC
            """)
            users = cursor.fetchall()

        return {"status": "success", "data": users}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# เปลี่ยนสถานะบัญชีผู้ใช้ (active / ban / suspended)
def update_user_status(user_id, status):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # อัปเดต account_status ในตาราง users
            cursor.execute(
                "UPDATE users SET account_status = %s WHERE user_id = %s",
                (status, user_id)
            )
        connection.commit()
        return {"status": "success", "message": "อัปเดตสถานะสำเร็จ"}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายการรายงานทั้งหมดพร้อมข้อมูลผู้รายงาน
def get_reports():
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # JOIN users เพื่อแสดงชื่อและอีเมลของผู้ที่ส่งรายงาน
            cursor.execute("""
                SELECT
                    r.report_id,
                    r.title,
                    r.description,
                    r.target_type,
                    r.target_id,
                    r.status,
                    r.created_at,
                    u.name  AS reporter_name,
                    u.email AS reporter_email
                FROM reports r
                JOIN users u ON r.reporter_id = u.user_id
                ORDER BY r.created_at DESC
            """)
            data = cursor.fetchall()

        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# อัปเดตสถานะรายงาน (pending / investigating / resolved / dismissed)
def update_report_status(report_id, status):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # เปลี่ยนสถานะรายงานตาม report_id ที่ระบุ
            cursor.execute(
                "UPDATE reports SET status = %s WHERE report_id = %s",
                (status, report_id)
            )
        connection.commit()
        return {"status": "success", "message": "อัปเดตสถานะเรียบร้อย"}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# อนุมัติหรือปฏิเสธ tutor พร้อมบันทึกผู้ทำรายการและเหตุผล
def verify_tutor(tutor_id, action, reject_reason, admin_user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ตรวจสอบว่า tutor มีอยู่ในระบบก่อน
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE tutor_id = %s", (tutor_id,))
            if not cursor.fetchone():
                return {"status": "error", "message": "ไม่พบ tutor นี้", "not_found": True}

            # บันทึกผลการตรวจสอบ พร้อมระบุ admin ที่ดำเนินการและเวลา
            cursor.execute("""
                UPDATE tutor_profiles
                SET verification_status = %s,
                    verified_by = %s,
                    verified_at = NOW(),
                    reject_reason = %s
                WHERE tutor_id = %s
            """, (action, admin_user_id, reject_reason if action == "rejected" else None, tutor_id))

        connection.commit()
        msg = "อนุมัติ tutor สำเร็จ" if action == "verified" else "ปฏิเสธ tutor สำเร็จ"
        return {"status": "success", "message": msg}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายชื่อ tutor ที่รอการอนุมัติ เรียงตามวันที่ยื่นก่อน
def get_pending_tutors():
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # JOIN users เพื่อดึงชื่อและอีเมล เรียงตามวันยื่นเอกสารเก่าสุดก่อน
            cursor.execute("""
                SELECT
                    tp.tutor_id,
                    tp.verification_status,
                    tp.bio,
                    tp.hourly_rate,
                    tp.profile_picture_url,
                    tp.verification_submitted_at,
                    tp.reject_reason,
                    u.user_id,
                    u.name,
                    u.email,
                    u.created_at
                FROM tutor_profiles tp
                JOIN users u ON tp.user_id = u.user_id
                WHERE tp.verification_status = 'pending'
                ORDER BY tp.verification_submitted_at ASC, u.created_at ASC
            """)
            data = cursor.fetchall()

        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
