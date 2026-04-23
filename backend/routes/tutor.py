# tutor_routes.py
import os
import uuid
from backend.services.tutor_service import (
    get_tutor_profile,
    update_tutor_profile
)
from flask import Blueprint, request, jsonify
from backend.utils.auth_helper import token_required, role_required
from backend.services.tutor_service import (
    get_open_posts,
    apply_to_post,
    get_tutor_applications,
    get_tutor_dashboard_stats,
    get_tutor_schedule,
)
from werkzeug.utils import secure_filename

tutor_bp = Blueprint('tutor', __name__)


# GET /tutor/posts?subject=<keyword> — ดูโพสต์ที่เปิดรับสมัครทั้งหมด
@tutor_bp.route('/posts', methods=['GET'])
def list_open_posts():
    subject_filter = request.args.get('subject', None)
    result = get_open_posts(subject_filter=subject_filter)
    return jsonify(result), 200


# POST /tutor/apply — ติวเตอร์สมัครรับงาน
# Body: { "tutor_id": <user_id>, "post_id": <post_id> }
@tutor_bp.route('/apply', methods=['POST'])
def apply():
    data = request.get_json()

    user_id = data.get('tutor_id')   # หน้าบ้านส่ง tutor_id ซึ่งคือ user_id
    post_id = data.get('post_id')

    if not all([user_id, post_id]):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน (tutor_id, post_id)"}), 400

    result = apply_to_post(user_id=user_id, post_id=post_id)
    status_code = 201 if result["status"] == "success" else 400
    return jsonify(result), status_code


# GET /tutor/my-applications?tutor_id=<user_id> — ดูสถานะใบสมัครที่ส่งไปทั้งหมด
@tutor_bp.route('/my-applications', methods=['GET'])
def my_applications():
    user_id = request.args.get('tutor_id')

    if not user_id:
        return jsonify({"status": "error", "message": "Missing tutor_id", "data": []}), 400

    result = get_tutor_applications(user_id=user_id)
    return jsonify(result), 200


# GET /tutor/dashboard?tutor_id=<user_id> — สรุปสถิติ Dashboard
@tutor_bp.route('/dashboard', methods=['GET'])
def dashboard_stats():
    user_id = request.args.get('tutor_id')

    if not user_id:
        return jsonify({"status": "error", "message": "Missing tutor_id"}), 400

    result = get_tutor_dashboard_stats(user_id=user_id)
    return jsonify(result), 200


# GET /tutor/schedule?tutor_id=<user_id> — ดูตารางสอนที่ได้รับการยืนยันแล้ว
@tutor_bp.route('/schedule', methods=['GET'])
def schedule():
    user_id = request.args.get('tutor_id')

    if not user_id:
        return jsonify({"status": "error", "message": "Missing tutor_id", "data": []}), 400

    result = get_tutor_schedule(user_id=user_id)
    return jsonify(result), 200

# =========================
# Tutor Profile API
# =========================


# GET /tutor/profile — ดึงข้อมูลโปรไฟล์ติวเตอร์ของ user ที่ login อยู่
@tutor_bp.route("/profile", methods=["GET"])
@token_required
@role_required("tutor")
def get_profile():
    result = get_tutor_profile(request.user_id)
    return jsonify(result)


# PUT /tutor/profile — อัปเดตข้อมูลโปรไฟล์ติวเตอร์ (รวมรูปโปรไฟล์)
@tutor_bp.route("/profile", methods=["PUT"])
@token_required
@role_required("tutor")
def update_profile():

    bio = request.form.get("bio")
    hourly_rate = request.form.get("hourly_rate")
    profile_file = request.files.get("profile_picture")

    filename = None

    if profile_file:
        original_filename = secure_filename(
            profile_file.filename
        )

        file_ext = os.path.splitext(
            original_filename
        )[1]

        filename = f"{uuid.uuid4()}{file_ext}"

        upload_folder = "static/uploads"

        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        upload_path = os.path.join(
            upload_folder,
            filename
        )

        profile_file.save(upload_path)

    result = update_tutor_profile(
        request.user_id,
        bio,
        hourly_rate,
        filename
    )

    return jsonify(result)