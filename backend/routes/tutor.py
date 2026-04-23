# tutor_routes.py
import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.utils.auth_helper import token_required, role_required
# tutor_routes.py
import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.utils.auth_helper import token_required, role_required
from backend.services.tutor_service import (
    get_tutor_profile,
    update_tutor_profile,
    get_open_posts,
    apply_to_post,
    get_tutor_applications,
    get_tutor_dashboard_stats,
    get_tutor_schedule,
    get_available_tutors,
    get_tutor_profile_public,
    get_tutor_wallet,      
    request_withdrawal 
)

tutor_bp = Blueprint('tutor', __name__)

# ✨ เพิ่ม Route สำหรับ Wallet
@tutor_bp.route('/api/wallet', methods=['GET'])
@token_required
@role_required('tutor')
def view_wallet():
    # เรียกใช้ service เพื่อดึงยอดเงินและรายการเดินบัญชี
    result = get_tutor_wallet(request.user_id)
    return jsonify(result), 200

@tutor_bp.route('/api/wallet/withdraw', methods=['POST'])
@token_required
@role_required('tutor')
def withdraw():
    data = request.get_json()
    amount = data.get('amount')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')
    
    if not all([amount, bank_name, account_number]):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = request_withdrawal(request.user_id, amount, bank_name, account_number)
    return jsonify(result), 200 if result['status'] == 'success' else 400

tutor_bp = Blueprint('tutor', __name__)


# GET /tutor/posts?subject=<keyword> — ดูโพสต์ที่เปิดรับสมัครทั้งหมด
@tutor_bp.route('/posts', methods=['GET'])
@token_required
@role_required('tutor')
def list_open_posts():
    subject_filter = request.args.get('subject', None)
    result = get_open_posts(subject_filter=subject_filter)
    return jsonify(result), 200


# POST /tutor/apply — ติวเตอร์สมัครรับงาน
@tutor_bp.route('/apply', methods=['POST'])
@token_required
@role_required('tutor')
def apply():
    result = apply_to_post(user_id=request.user_id, post_id=request.get_json().get('post_id'))
    status_code = 201 if result["status"] == "success" else 400
    return jsonify(result), status_code


# GET /tutor/my-applications — ดูสถานะใบสมัครที่ส่งไปทั้งหมด
@tutor_bp.route('/my-applications', methods=['GET'])
@token_required
@role_required('tutor')
def my_applications():
    result = get_tutor_applications(user_id=request.user_id)
    return jsonify(result), 200


# GET /tutor/dashboard — สรุปสถิติ Dashboard
@tutor_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('tutor')
def dashboard_stats():
    result = get_tutor_dashboard_stats(user_id=request.user_id)
    return jsonify(result), 200


# GET /tutor/schedule — ดูตารางสอนที่ได้รับการยืนยันแล้ว
@tutor_bp.route('/schedule', methods=['GET'])
@token_required
@role_required('tutor')
def schedule():
    result = get_tutor_schedule(user_id=request.user_id)
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

# GET /tutor/list — รายชื่อติวเตอร์ทั้งหมดที่ verified
@tutor_bp.route('/list', methods=['GET'])
@token_required
def list_tutors():
    result = get_available_tutors()
    return jsonify(result), 200

# GET /tutor/profile/<tutor_id> — โปรไฟล์ติวเตอร์รายบุคคล
@tutor_bp.route('/profile/<int:tutor_id>', methods=['GET'])
@token_required
def public_tutor_profile(tutor_id):
    result = get_tutor_profile_public(tutor_id)
    status_code = 200 if result['status'] == 'success' else 404
    return jsonify(result), status_code

# เพิ่มใน tutor.py

@tutor_bp.route('/wallet', methods=['GET'])
@token_required
@role_required('tutor')
def view_wallet():
    result = get_tutor_wallet(request.user_id)
    return jsonify(result)

@tutor_bp.route('/wallet/withdraw', methods=['POST'])
@token_required
@role_required('tutor')
def withdraw():
    data = request.get_json()
    amount = data.get('amount')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')
    
    if not all([amount, bank_name, account_number]):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = request_withdrawal(request.user_id, amount, bank_name, account_number)
    return jsonify(result)