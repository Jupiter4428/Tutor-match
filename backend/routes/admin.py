from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.utils.auth_helper import token_required, role_required

admin_bp = Blueprint('admin', __name__, url_prefix="/admin")


@admin_bp.route("/stats", methods=["GET"])
@token_required
@role_required("admin")
def get_admin_stats():
    try:
        connection = db.get_connection()

        with connection.cursor() as cursor:

            cursor.execute("SELECT COUNT(*) as total FROM users")
            total_users = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM users 
                WHERE role='student'
            """)
            students = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM users 
                WHERE role='tutor'
            """)
            tutors = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM student_posts
            """)
            posts = cursor.fetchone()["total"]

            pending = 0
            banned = 0

        connection.close()

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


@admin_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def get_all_users():
    try:
        connection = db.get_connection()

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    user_id as id,
                    name,
                    email,
                    role,
                    created_at as createdAt
                FROM users
                ORDER BY created_at DESC
            """)

            users = cursor.fetchall()

            for user in users:
                user["status"] = "approved"
                
            print(users)
            
        connection.close()

        return jsonify({
            "status": "success",
            "data": users
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@admin_bp.route("/reports", methods=["GET"])
@token_required
@role_required("admin")
def get_reports():
    return jsonify({
        "status": "success",
        "data": []
    })
    