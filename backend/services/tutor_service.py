# tutor_service.py
from backend.extensions import db


# ดึงโพสต์ที่เปิดรับสมัครทั้งหมด (สำหรับติวเตอร์เลือกงาน)
def get_open_posts(subject_filter=None):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ดึงโพสต์ที่ status=open และไม่ถูกซ่อน พร้อมชื่อนักเรียน
            sql = """
                SELECT
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.description, p.budget,
                    p.created_at,
                    u.name AS student_name
                FROM student_posts p
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE p.status = 'open' AND p.is_hidden = FALSE
            """
            params = []

            # กรองตามวิชาถ้ามี filter
            if subject_filter and len(subject_filter) <= 100:
                sql += " AND p.subject LIKE %s"
                params.append(f"%{subject_filter}%")

            sql += " ORDER BY p.created_at DESC"

            cursor.execute(sql, params)
            posts = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": posts}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ติวเตอร์สมัครรับงานจากโพสต์
def apply_to_post(user_id, post_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา tutor_id และเช็ค verification_status ในครั้งเดียว
            cursor.execute(
                "SELECT tutor_id, verification_status FROM tutor_profiles WHERE user_id = %s",
                (user_id,)
            )
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์ของคุณในระบบ"}
            # ป้องกันติวเตอร์ที่ยังไม่ผ่านการยืนยันสมัครงาน
            if profile['verification_status'] != 'verified':
                return {"status": "error", "message": "บัญชีของคุณยังไม่ได้รับการยืนยันจาก Admin"}

            tutor_id = profile['tutor_id']

            # ตรวจสอบว่าโพสต์ยังเปิดรับสมัครอยู่
            cursor.execute("SELECT status FROM student_posts WHERE post_id = %s AND is_hidden = FALSE", (post_id,))
            post = cursor.fetchone()
            if not post:
                return {"status": "error", "message": "ไม่พบโพสต์นี้ในระบบ"}
            if post['status'] != 'open':
                return {"status": "error", "message": "โพสต์นี้ปิดรับสมัครแล้ว"}

            # ป้องกันสมัครซ้ำในโพสต์เดิม
            cursor.execute(
                "SELECT app_id FROM applications WHERE post_id = %s AND tutor_id = %s",
                (post_id, tutor_id)
            )
            if cursor.fetchone():
                return {"status": "error", "message": "คุณได้สมัครโพสต์นี้ไปแล้ว"}

            # บันทึกใบสมัครสถานะ pending รอนักเรียนเลือก
            cursor.execute(
                "INSERT INTO applications (post_id, tutor_id, status) VALUES (%s, %s, 'pending')",
                (post_id, tutor_id)
            )
            connection.commit()

            return {"status": "success", "message": "สมัครงานสำเร็จแล้ว รอการยืนยันจากนักเรียน", "data": {"app_id": cursor.lastrowid}}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดูรายการใบสมัครทั้งหมดที่ติวเตอร์ส่งไป (พร้อมสถานะ)
def get_tutor_applications(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา tutor_id ของผู้ใช้
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์", "data": []}

            tutor_id = profile['tutor_id']

            # ดึงใบสมัครทั้งหมดพร้อมรายละเอียดโพสต์และชื่อนักเรียน
            sql = """
                SELECT
                    a.app_id, a.status AS application_status, a.applied_at,
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.budget,
                    u.name AS student_name
                FROM applications a
                JOIN student_posts p ON a.post_id = p.post_id
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u ON sp.user_id = u.user_id
                WHERE a.tutor_id = %s
                ORDER BY a.applied_at DESC
            """
            cursor.execute(sql, (tutor_id,))
            applications = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": applications}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ดึงข้อมูลสรุปสำหรับ Dashboard ของติวเตอร์
def get_tutor_dashboard_stats(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา tutor_id ของผู้ใช้
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์"}

            tutor_id = profile['tutor_id']

            # ดึงสถิติ 4 ตัวในครั้งเดียว: งานที่กำลังสอน, งานที่เปิดรับ, รายได้เดือนนี้, rating เฉลี่ย
            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM applications
                     WHERE tutor_id = %s AND status = 'accepted') AS teaching_now,

                    (SELECT COUNT(*) FROM student_posts
                     WHERE status = 'open' AND is_hidden = FALSE) AS available_jobs,

                    (SELECT COALESCE(SUM(tl.amount), 0)
                     FROM transaction_logs tl
                     JOIN wallets w ON tl.wallet_id = w.wallet_id
                     WHERE w.user_id = %s
                       AND tl.transaction_type = 'tutor_earnings'
                       AND MONTH(tl.transaction_date) = MONTH(CURDATE())
                       AND YEAR(tl.transaction_date)  = YEAR(CURDATE())) AS monthly_income,

                    (SELECT ROUND(AVG(r.rating), 1)
                     FROM reviews r JOIN applications a ON r.app_id = a.app_id
                     WHERE a.tutor_id = %s) AS avg_rating
            """, (tutor_id, user_id, tutor_id))
            row = cursor.fetchone()

            return {
                "status": "success",
                "message": "ดึงข้อมูลสำเร็จ",
                "data": {
                    "available_jobs": int(row['available_jobs']),
                    "teaching_now":   int(row['teaching_now']),
                    "monthly_income": float(row['monthly_income']),
                    "avg_rating":     round(float(row['avg_rating'] or 0), 1),
                }
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงตารางสอนของติวเตอร์ (applications ที่ได้รับการ accept แล้ว)
def get_tutor_schedule(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา tutor_id ของผู้ใช้
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            profile = cursor.fetchone()
            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์", "data": []}

            tutor_id = profile['tutor_id']

            # ดึงตารางสอนทั้งหมดพร้อมข้อมูลโพสต์, นักเรียน และสถานะชำระเงิน
            sql = """
                SELECT
                    a.app_id, a.applied_at, a.teaching_status,
                    p.post_id, p.subject, p.grade_level, p.learning_format,
                    p.location, p.preferred_time, p.budget,
                    u.name AS student_name,
                    pay.payment_id, pay.status AS payment_status
                FROM applications a
                JOIN student_posts p    ON a.post_id    = p.post_id
                JOIN student_profiles sp ON p.student_id = sp.student_id
                JOIN users u            ON sp.user_id   = u.user_id
                LEFT JOIN payments pay  ON a.app_id     = pay.app_id
                WHERE a.tutor_id = %s AND a.status = 'accepted'
                ORDER BY a.applied_at DESC
            """
            cursor.execute(sql, (tutor_id,))
            schedule = cursor.fetchall()

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": schedule}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ดึงโปรไฟล์ติวเตอร์ของตัวเอง (สำหรับหน้า edit)
def get_tutor_profile(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    tp.tutor_id, tp.bio, tp.hourly_rate,
                    tp.verification_status, tp.profile_picture_url,
                    tp.reject_reason,
                    u.name, u.email
                FROM tutor_profiles tp
                JOIN users u ON tp.user_id = u.user_id
                WHERE tp.user_id = %s
            """, (user_id,))
            profile = cursor.fetchone()

            if not profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์"}

            # ดึงวิชาที่สอนเพื่อให้ edit form pre-populate checkboxes ได้ถูกต้อง
            cursor.execute(
                "SELECT subject FROM tutor_subjects WHERE tutor_id = %s",
                (profile['tutor_id'],)
            )
            profile['subjects'] = [r['subject'] for r in cursor.fetchall()]

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": profile}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# อัปเดตโปรไฟล์ติวเตอร์ (bio, ราคา, รูปโปรไฟล์, วิชาที่สอน)
def update_tutor_profile(user_id, bio, hourly_rate, filename=None, subjects=None):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            if filename:
                cursor.execute(
                    "UPDATE tutor_profiles SET bio=%s, hourly_rate=%s, profile_picture_url=%s WHERE user_id=%s",
                    (bio, hourly_rate, f"static/uploads/{filename}", user_id)
                )
            else:
                cursor.execute(
                    "UPDATE tutor_profiles SET bio=%s, hourly_rate=%s WHERE user_id=%s",
                    (bio, hourly_rate, user_id)
                )

            # อัปเดตวิชาที่สอน (ถ้าส่งมา): ลบเก่าแล้ว insert ใหม่
            if subjects is not None:
                cursor.execute(
                    "SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,)
                )
                row = cursor.fetchone()
                if row:
                    tutor_id = row['tutor_id']
                    cursor.execute("DELETE FROM tutor_subjects WHERE tutor_id = %s", (tutor_id,))
                    if subjects:
                        cursor.executemany(
                            "INSERT INTO tutor_subjects (tutor_id, subject) VALUES (%s, %s)",
                            [(tutor_id, s) for s in subjects]
                        )

            connection.commit()
            return {"status": "success", "message": "อัปเดตโปรไฟล์สำเร็จ", "data": None}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงรายชื่อติวเตอร์ทั้งหมดที่ verified สำหรับหน้าค้นหา
def get_available_tutors():
    from collections import defaultdict
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ดึงติวเตอร์ที่ verified และ active พร้อม rating เฉลี่ย เรียงตาม rating
            cursor.execute("""
                SELECT
                    tp.tutor_id, u.name, tp.bio, tp.hourly_rate,
                    tp.profile_picture_url,
                    ROUND(AVG(r.rating), 1) AS avg_rating,
                    COUNT(r.review_id)      AS review_count
                FROM tutor_profiles tp
                JOIN users u ON tp.user_id = u.user_id
                LEFT JOIN applications a ON a.tutor_id = tp.tutor_id
                LEFT JOIN reviews r      ON r.app_id   = a.app_id AND r.is_hidden = FALSE
                WHERE tp.verification_status = 'verified'
                  AND u.account_status       = 'active'
                GROUP BY tp.tutor_id
                ORDER BY avg_rating DESC, review_count DESC
            """)
            tutors = cursor.fetchall()

            if not tutors:
                return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": []}

            tutor_ids = [t['tutor_id'] for t in tutors]
            fmt = ",".join(["%s"] * len(tutor_ids))

            # ดึง subjects ของทุก tutor ในครั้งเดียว
            cursor.execute(
                f"SELECT tutor_id, subject FROM tutor_subjects WHERE tutor_id IN ({fmt})",
                tutor_ids
            )
            subjects_map = defaultdict(list)
            for row in cursor.fetchall():
                subjects_map[row['tutor_id']].append(row['subject'])

            # ดึง experiences ของทุก tutor ในครั้งเดียว
            cursor.execute(
                f"SELECT tutor_id, experience_detail FROM tutor_experiences WHERE tutor_id IN ({fmt})",
                tutor_ids
            )
            exp_map = defaultdict(list)
            for row in cursor.fetchall():
                exp_map[row['tutor_id']].append(row['experience_detail'])

            result = []
            for t in tutors:
                tid = t['tutor_id']
                result.append({
                    "tutor_id":            tid,
                    "name":                t['name'],
                    "bio":                 t['bio'],
                    "hourly_rate":         float(t['hourly_rate']),
                    "avg_rating":          float(t['avg_rating']) if t['avg_rating'] else None,
                    "review_count":        int(t['review_count']),
                    "subjects":            subjects_map[tid],
                    "experiences":         exp_map[tid],
                    "profile_picture_url": t['profile_picture_url'],
                })

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": result}

    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
    finally:
        connection.close()


# ดึงโปรไฟล์สาธารณะของติวเตอร์รายบุคคล
def get_tutor_profile_public(tutor_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ดึงข้อมูลหลักพร้อม rating เฉลี่ย (เฉพาะ verified เท่านั้น)
            cursor.execute("""
                SELECT tp.tutor_id, u.name, tp.bio, tp.hourly_rate,
                       tp.profile_picture_url,
                       ROUND(AVG(r.rating), 1) AS avg_rating,
                       COUNT(r.review_id)       AS review_count
                FROM tutor_profiles tp
                JOIN users u ON tp.user_id = u.user_id
                LEFT JOIN applications a ON a.tutor_id = tp.tutor_id
                LEFT JOIN reviews r      ON r.app_id   = a.app_id AND r.is_hidden = FALSE
                WHERE tp.tutor_id = %s AND tp.verification_status = 'verified'
                GROUP BY tp.tutor_id
            """, (tutor_id,))
            t = cursor.fetchone()
            if not t:
                return {"status": "error", "message": "ไม่พบติวเตอร์"}

            # ดึงรายวิชาที่สอน
            cursor.execute("SELECT subject FROM tutor_subjects WHERE tutor_id = %s", (tutor_id,))
            subjects = [r['subject'] for r in cursor.fetchall()]

            # ดึงประสบการณ์
            cursor.execute("SELECT experience_detail FROM tutor_experiences WHERE tutor_id = %s", (tutor_id,))
            experiences = [r['experience_detail'] for r in cursor.fetchall()]

            return {"status": "success", "message": "ดึงข้อมูลสำเร็จ", "data": {
                "tutor_id":            t['tutor_id'],
                "name":                t['name'],
                "bio":                 t['bio'],
                "hourly_rate":         float(t['hourly_rate']),
                "avg_rating":          float(t['avg_rating']) if t['avg_rating'] else None,
                "review_count":        int(t['review_count']),
                "subjects":            subjects,
                "experiences":         experiences,
                "profile_picture_url": t['profile_picture_url'],
            }}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงข้อมูลกระเป๋าเงินของติวเตอร์ (สร้างใหม่อัตโนมัติถ้ายังไม่มี)
def get_tutor_wallet(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ค้นหากระเป๋าเงิน
            cursor.execute(
                "SELECT wallet_id, balance, status, updated_at FROM wallets WHERE user_id = %s",
                (user_id,)
            )
            wallet = cursor.fetchone()

            # สร้างกระเป๋าใหม่ถ้ายังไม่มี
            if not wallet:
                cursor.execute(
                    "INSERT INTO wallets (user_id, balance, status) VALUES (%s, 0.00, 'active')",
                    (user_id,)
                )
                connection.commit()
                cursor.execute(
                    "SELECT wallet_id, balance, status, updated_at FROM wallets WHERE user_id = %s",
                    (user_id,)
                )
                wallet = cursor.fetchone()

            return {"status": "success", "data": wallet}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


# ดึงประวัติรายการทางการเงินของติวเตอร์
def get_tutor_transactions(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # หา wallet_id ก่อน
            cursor.execute("SELECT wallet_id FROM wallets WHERE user_id = %s", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "success", "data": []}

            # ดึงประวัติรายการเรียงตามวันล่าสุด
            cursor.execute("""
                SELECT transaction_id, transaction_type, amount, balance_after, description,
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


# ขอถอนเงินออกจากกระเป๋าไปยังบัญชีธนาคาร
def request_withdrawal(user_id, amount, bank_name, account_number, account_name=''):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            # ล็อคกระเป๋าและตรวจสอบยอดเงิน
            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "error", "message": "ไม่พบกระเป๋าเงิน"}
            if float(wallet['balance']) < float(amount):
                return {"status": "error", "message": "ยอดเงินไม่เพียงพอ"}

            new_balance = float(wallet['balance']) - float(amount)
            # หักเงินจากกระเป๋า
            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s", (new_balance, wallet['wallet_id']))

            # บันทึก transaction log พร้อมระบุธนาคารและชื่อบัญชีปลายทาง
            name_part = f" ชื่อบัญชี {account_name}" if account_name else ""
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after, reference_type, description)
                VALUES (%s, 'withdrawal', %s, %s, 'withdrawal_request', %s)
            """, (wallet['wallet_id'], amount, new_balance,
                  f"ถอนเงินเข้าบัญชี {bank_name} ({account_number}){name_part}"))

            connection.commit()
            return {"status": "success", "message": "ส่งคำขอถอนเงินเรียบร้อยแล้ว"}
    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
