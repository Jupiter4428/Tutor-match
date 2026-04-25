from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.utils.auth_helper import token_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix="/admin")


@admin_bp.route("/stats", methods=["GET"])
@token_required
@role_required("admin")
def get_admin_stats():
    """ดึงสถิติของแอดมิน"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM users")
            total_users = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM users
                WHERE role = 'student'
            """)
            students = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM users
                WHERE role = 'tutor'
            """)
            tutors = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM student_posts
            """)
            posts = cursor.fetchone()["total"]

            # นับ tutor ที่ยังรอ verify (pending อยู่ใน tutor_profiles ไม่ใช่ users)
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM tutor_profiles
                WHERE verification_status = 'pending'
            """)
            pending = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM users
                WHERE account_status IN ('ban', 'suspended')
            """)
            banned = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM reports
                WHERE status = 'pending'
            """)
            reports = cursor.fetchone()["total"]

        return jsonify({
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
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        connection.close()


@admin_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def get_all_users():
    """ดึงรายชื่อผู้ใช้ทั้งหมด"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    u.user_id as id,
                    u.name,
                    u.email,
                    u.role,
                    u.account_status as status,
                    u.created_at as createdAt
                FROM users u
                ORDER BY u.created_at DESC
            """)
            users = cursor.fetchall()

        return jsonify({
            "status": "success",
            "data": users
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        connection.close()


@admin_bp.route("/reports", methods=["GET"])
@token_required
@role_required("admin")
def get_reports():
    """ดึงรายการรายงานทั้งหมด"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
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

        return jsonify({"status": "success", "data": data})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        connection.close()


@admin_bp.route("/reports/<int:report_id>/status", methods=["POST"])
@token_required
@role_required("admin")
def update_report_status(report_id):
    """อัปเดตสถานะรายงาน"""
    connection = db.get_connection()
    try:
        data = request.get_json()
        status = data.get("status")
        if status not in ("pending", "investigating", "resolved", "dismissed"):
            return jsonify({"status": "error", "message": "สถานะไม่ถูกต้อง"}), 400

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE reports SET status = %s WHERE report_id = %s",
                (status, report_id)
            )
        connection.commit()

        return jsonify({"status": "success", "message": "อัปเดตสถานะเรียบร้อย"})

    except Exception as e:
        connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        connection.close()


@admin_bp.route("/users/status", methods=["POST"])
@token_required
@role_required("admin")
def update_user_status():
    """อัปเดตสถานะผู้ใช้"""
    connection = db.get_connection()
    try:
        data = request.get_json()

        user_id = data.get("user_id")
        status = data.get("status")

        if not user_id or not status:
            return jsonify({
                "status": "error",
                "message": "ต้องส่ง user_id และ status"
            }), 400

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET account_status = %s
                WHERE user_id = %s
            """, (status, user_id))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "อัปเดตสถานะสำเร็จ"
        })

    except Exception as e:
        connection.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        connection.close()


@admin_bp.route("/tutors/verify", methods=["POST"])
@token_required
@role_required("admin")
def verify_tutor():
    """Admin อนุมัติหรือปฏิเสธ tutor"""
    connection = db.get_connection()
    try:
        data = request.get_json()
        tutor_id = data.get("tutor_id")
        action = data.get("action")  # 'verified' | 'rejected'
        reject_reason = data.get("reject_reason", "")

        if not tutor_id or action not in ("verified", "rejected"):
            return jsonify({
                "status": "error",
                "message": "ต้องส่ง tutor_id และ action (verified/rejected)"
            }), 400

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT tutor_id FROM tutor_profiles WHERE tutor_id = %s",
                (tutor_id,)
            )
            if not cursor.fetchone():
                return jsonify({"status": "error", "message": "ไม่พบ tutor นี้"}), 404

            cursor.execute("""
                UPDATE tutor_profiles
                SET verification_status = %s,
                    verified_by = %s,
                    verified_at = NOW(),
                    reject_reason = %s
                WHERE tutor_id = %s
            """, (action, request.user_id, reject_reason if action == "rejected" else None, tutor_id))

        connection.commit()

        msg = "อนุมัติ tutor สำเร็จ" if action == "verified" else "ปฏิเสธ tutor สำเร็จ"
        return jsonify({"status": "success", "message": msg})

    except Exception as e:
        connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        connection.close()


@admin_bp.route("/tutors/pending", methods=["GET"])
@token_required
@role_required("admin")
def get_pending_tutors():
    """ดึงรายชื่อ tutor ที่รอการอนุมัติ"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
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

        return jsonify({"status": "success", "data": data})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        connection.close()