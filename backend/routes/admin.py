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

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM users
                WHERE account_status = 'pending'
            """)
            pending = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM users
                WHERE account_status = 'banned'
            """)
            banned = cursor.fetchone()["total"]
            
        return jsonify({
            "status": "success",
            "data": {
                "total_users": total_users,
                "students": students,
                "tutors": tutors,
                "posts": posts,
                "reports": 0,
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
    """ดึงรายการรายงานที่ผ่านมา"""
    return jsonify({
        "status": "success",
        "data": []
    })


@admin_bp.route("/users/status", methods=["POST"])
@token_required
@role_required("admin")
def update_user_status():
    """อัปเดตสถานะผู้ใช้"""
    connection = db.get_connection()
    try:
        data = request.get_json()

        # ตรวจสอบข้อมูลที่จำเป็น
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