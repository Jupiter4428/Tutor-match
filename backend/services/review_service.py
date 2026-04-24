from backend.extensions import db


def get_all_reviews(tutor_id=None, rating=None, subject=None, search=None):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT
                    r.review_id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    u.name AS student_name,
                    stp.user_id AS student_user_id,
                    tp.tutor_id,
                    tu.name AS tutor_name,
                    sp.subject
                FROM reviews r
                JOIN applications a ON r.app_id = a.app_id
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users tu ON tp.user_id = tu.user_id
                JOIN student_posts sp ON a.post_id = sp.post_id
                JOIN student_profiles stp ON sp.student_id = stp.student_id
                JOIN users u ON stp.user_id = u.user_id
                WHERE r.is_hidden = FALSE
            """
            params = []

            if tutor_id:
                sql += " AND tp.tutor_id = %s"
                params.append(tutor_id)

            if rating:
                sql += " AND r.rating = %s"
                params.append(rating)

            if subject:
                sql += " AND sp.subject LIKE %s"
                params.append(f"%{subject}%")

            if search:
                sql += " AND (r.comment LIKE %s OR u.name LIKE %s OR tu.name LIKE %s)"
                keyword = f"%{search}%"
                params.extend([keyword, keyword, keyword])

            sql += " ORDER BY r.created_at DESC"

            cursor.execute(sql, params)
            rows = cursor.fetchall()

            return {
                "status": "success",
                "message": "ดึงรีวิวสำเร็จ",
                "data": rows
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": []
        }
    finally:
        connection.close()


def get_reviews_by_tutor(tutor_id, rating=None, subject=None, search=None):
    return get_all_reviews(
        tutor_id=tutor_id,
        rating=rating,
        subject=subject,
        search=search
    )


def get_reviewable_applications(user_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT student_id FROM student_profiles WHERE user_id = %s",
                (user_id,)
            )
            student_profile = cursor.fetchone()
            if not student_profile:
                return {
                    "status": "error",
                    "message": "ไม่พบโปรไฟล์นักเรียน",
                    "data": []
                }

            student_id = student_profile["student_id"]

            cursor.execute("""
                SELECT
                    a.app_id,
                    a.status,
                    a.teaching_status,
                    a.applied_at,
                    tp.tutor_id,
                    tu.name AS tutor_name,
                    sp.subject,
                    p.post_id,
                    r.review_id
                FROM applications a
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                JOIN users tu ON tp.user_id = tu.user_id
                JOIN student_posts sp ON a.post_id = sp.post_id
                LEFT JOIN reviews r ON r.app_id = a.app_id
                LEFT JOIN student_profiles psp ON sp.student_id = psp.student_id
                LEFT JOIN users su ON psp.user_id = su.user_id
                LEFT JOIN student_posts p ON a.post_id = p.post_id
                WHERE sp.student_id = %s
                  AND a.status = 'accepted'
                  AND a.teaching_status = 'completed'
                ORDER BY a.app_id DESC
            """, (student_id,))

            rows = cursor.fetchall()

            available = []
            for row in rows:
                if row["review_id"] is None:
                    available.append({
                        "app_id": row["app_id"],
                        "tutor_id": row["tutor_id"],
                        "tutor_name": row["tutor_name"],
                        "subject": row["subject"],
                        "status": row["status"],
                        "teaching_status": row["teaching_status"]
                    })

            return {
                "status": "success",
                "message": "ดึงรายการที่รีวิวได้สำเร็จ",
                "data": available
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": []
        }
    finally:
        connection.close()


def create_review(user_id, app_id, rating, comment):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            student_profile = cursor.fetchone()
            if not student_profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            student_id = student_profile["student_id"]

            cursor.execute("""
                SELECT
                    a.app_id,
                    a.status,
                    a.teaching_status,
                    a.tutor_id,
                    sp.student_id
                FROM applications a
                JOIN student_posts sp ON a.post_id = sp.post_id
                WHERE a.app_id = %s
            """, (app_id,))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบงานที่ต้องการรีวิว"}

            if app["student_id"] != student_id:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์รีวิวงานนี้"}

            if app["status"] != "accepted":
                return {"status": "error", "message": "รีวิวได้เฉพาะงานที่ถูกยืนยันแล้ว"}

            if app["teaching_status"] != "completed":
                return {"status": "error", "message": "รีวิวได้หลังสอนเสร็จเท่านั้น"}

            cursor.execute("SELECT review_id FROM reviews WHERE app_id = %s", (app_id,))
            if cursor.fetchone():
                return {"status": "error", "message": "งานนี้ถูกรีวิวไปแล้ว"}

            cursor.execute("""
                INSERT INTO reviews (app_id, rating, comment)
                VALUES (%s, %s, %s)
            """, (app_id, rating, comment))

            connection.commit()

            return {
                "status": "success",
                "message": "เพิ่มรีวิวสำเร็จ",
                "data": {
                    "review_id": cursor.lastrowid,
                    "app_id": app_id
                }
            }

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def delete_review(user_id, review_id):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            student_profile = cursor.fetchone()
            if not student_profile:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            student_id = student_profile["student_id"]

            cursor.execute("""
                SELECT
                    r.review_id,
                    r.app_id,
                    sp.student_id
                FROM reviews r
                JOIN applications a ON r.app_id = a.app_id
                JOIN student_posts sp ON a.post_id = sp.post_id
                WHERE r.review_id = %s
            """, (review_id,))
            review = cursor.fetchone()

            if not review:
                return {"status": "error", "message": "ไม่พบรีวิว"}

            if review["student_id"] != student_id:
                return {"status": "error", "message": "คุณไม่มีสิทธิ์ลบรีวิวนี้"}

            cursor.execute("DELETE FROM reviews WHERE review_id = %s", (review_id,))
            connection.commit()

            return {"status": "success", "message": "ลบรีวิวสำเร็จ", "data": None}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def get_rating_summary(tutor_id=None):
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT
                    COUNT(*) AS total_reviews,
                    ROUND(AVG(r.rating), 1) AS avg_rating,
                    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star,
                    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS four_star,
                    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS three_star,
                    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS two_star,
                    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS one_star
                FROM reviews r
                JOIN applications a ON r.app_id = a.app_id
                JOIN tutor_profiles tp ON a.tutor_id = tp.tutor_id
                WHERE r.is_hidden = FALSE
            """
            params = []

            if tutor_id:
                sql += " AND tp.tutor_id = %s"
                params.append(tutor_id)

            cursor.execute(sql, params)
            row = cursor.fetchone()

            total = int(row["total_reviews"] or 0)

            def percent(n):
                return round((int(n or 0) / total) * 100, 1) if total > 0 else 0

            data = {
                "avg_rating": float(row["avg_rating"] or 0),
                "total_reviews": total,
                "stars": {
                    "5": {"count": int(row["five_star"] or 0), "percent": percent(row["five_star"])},
                    "4": {"count": int(row["four_star"] or 0), "percent": percent(row["four_star"])},
                    "3": {"count": int(row["three_star"] or 0), "percent": percent(row["three_star"])},
                    "2": {"count": int(row["two_star"] or 0), "percent": percent(row["two_star"])},
                    "1": {"count": int(row["one_star"] or 0), "percent": percent(row["one_star"])}
                }
            }

            return {
                "status": "success",
                "message": "ดึงสรุปคะแนนสำเร็จ",
                "data": data
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": None
        }
    finally:
        connection.close()
