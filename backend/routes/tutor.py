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
    get_tutor_transactions,
    request_withdrawal
)
from backend.services.payment_service import start_class, end_class

tutor_bp = Blueprint('tutor', __name__)


# =========================
# Wallet API
# =========================

@tutor_bp.route('/wallet', methods=['GET'])
# เพิ่ม Route สำหรับ Wallet
@tutor_bp.route('/api/wallet', methods=['GET'])
@token_required
@role_required('tutor')
def get_wallet():
    """ดึงข้อมูลกระเป๋าเงินของติวเตอร์"""
    result = get_tutor_wallet(request.user_id)
    return jsonify(result), 200


# =========================
# Payment Flow API
# =========================

@tutor_bp.route('/api/class/start', methods=['POST'])
@token_required
@role_required('tutor')
def class_start():
    data   = request.get_json()
    app_id = data.get('app_id')
    if not app_id:
        return jsonify({"status": "error", "message": "ต้องส่ง app_id"}), 400
    result = start_class(request.user_id, app_id)
    return jsonify(result), 200 if result['status'] == 'success' else 400


@tutor_bp.route('/api/class/end', methods=['POST'])
@token_required
@role_required('tutor')
def class_end():
    data   = request.get_json()
    app_id = data.get('app_id')
    if not app_id:
        return jsonify({"status": "error", "message": "ต้องส่ง app_id"}), 400
    result = end_class(request.user_id, app_id)
    return jsonify(result), 200 if result['status'] == 'success' else 400


@tutor_bp.route('/api/wallet/transactions', methods=['GET'])
@token_required
@role_required('tutor')
def get_transactions():
    result = get_tutor_transactions(request.user_id)
    return jsonify(result), 200


@tutor_bp.route('/wallet/withdraw', methods=['POST'])
@tutor_bp.route('/api/wallet/withdraw', methods=['POST'])
@token_required
@role_required('tutor')
def request_withdraw():
    """ขอถอนเงินจากกระเป๋า"""
    data = request.get_json()
    amount = data.get('amount')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')

    if not all([amount, bank_name, account_number]):
        return jsonify({
            "status": "error",
            "message": "ต้องส่ง amount, bank_name, account_number"
        }), 400

    result = request_withdrawal(request.user_id, amount, bank_name, account_number)
    status_code = 200 if result['status'] == 'success' else 400
    return jsonify(result), status_code


# =========================
# Posts API
# =========================

@tutor_bp.route('/posts', methods=['GET'])
@token_required
@role_required('tutor')
def list_open_posts():
    """ดูโพสต์ที่เปิดรับสมัครทั้งหมด (รองรับ filter ตามวิชา)"""
    subject_filter = request.args.get('subject', None)
    result = get_open_posts(subject_filter=subject_filter)
    return jsonify(result), 200


# =========================
# Applications API
# =========================

@tutor_bp.route('/apply', methods=['POST'])
@token_required
@role_required('tutor')
def apply():
    """ติวเตอร์สมัครรับงาน"""
    try:
        data = request.get_json()
        post_id = data.get('post_id')

        if not post_id:
            return jsonify({
                "status": "error",
                "message": "ต้องส่ง post_id"
            }), 400

        result = apply_to_post(user_id=request.user_id, post_id=post_id)
        status_code = 201 if result["status"] == "success" else 400
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@tutor_bp.route('/my-applications', methods=['GET'])
@token_required
@role_required('tutor')
def my_applications():
    """ดูสถานะใบสมัครที่ส่งไปทั้งหมด"""
    result = get_tutor_applications(user_id=request.user_id)
    return jsonify(result), 200


# =========================
# Dashboard & Schedule API
# =========================

@tutor_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('tutor')
def dashboard_stats():
    """ดึงสถิติ Dashboard ของติวเตอร์"""
    result = get_tutor_dashboard_stats(user_id=request.user_id)
    return jsonify(result), 200


@tutor_bp.route('/schedule', methods=['GET'])
@token_required
@role_required('tutor')
def get_schedule():
    """ดูตารางสอนที่ได้รับการยืนยันแล้ว"""
    result = get_tutor_schedule(user_id=request.user_id)
    return jsonify(result), 200


# =========================
# Tutor Profile API
# =========================

@tutor_bp.route('/profile', methods=['GET'])
@token_required
@role_required('tutor')
def get_profile():
    """ดึงข้อมูลโปรไฟล์ติวเตอร์ของผู้ใช้ที่ login"""
    result = get_tutor_profile(request.user_id)
    return jsonify(result), 200


@tutor_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('tutor')
def update_profile():
    """อัปเดตข้อมูลโปรไฟล์ติวเตอร์ (รวมรูปโปรไฟล์)"""
    bio = request.form.get("bio")
    hourly_rate = request.form.get("hourly_rate")
    profile_file = request.files.get("profile_picture")

    filename = None

    if profile_file:
        original_filename = secure_filename(profile_file.filename)
        file_ext = os.path.splitext(original_filename)[1].lower()

        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

        if file_ext not in allowed_extensions:
            return jsonify({
                "status": "error",
                "message": "รองรับเฉพาะ JPG, PNG และ WEBP เท่านั้น"
            }), 400

        filename = f"{uuid.uuid4()}{file_ext}"
        upload_folder = os.path.join(os.getcwd(), "static", "uploads")

        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        upload_path = os.path.join(upload_folder, filename)
        profile_file.save(upload_path)

    result = update_tutor_profile(
        request.user_id,
        bio,
        hourly_rate,
        filename
    )

    return jsonify(result), 200


@tutor_bp.route('/list', methods=['GET'])
@token_required
def list_tutors():
    """ดึงรายชื่อติวเตอร์ทั้งหมดที่ verified"""
    result = get_available_tutors()
    return jsonify(result), 200


@tutor_bp.route('/profile/<int:tutor_id>', methods=['GET'])
@token_required
def public_tutor_profile(tutor_id):
    """ดึงโปรไฟล์ติวเตอร์รายบุคคล (โปรไฟล์สาธารณะ)"""
    result = get_tutor_profile_public(tutor_id)
    status_code = 200 if result['status'] == 'success' else 404
    return jsonify(result), status_code