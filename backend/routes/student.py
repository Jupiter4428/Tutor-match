# student_routes.py
from flask import Blueprint, request, jsonify
from backend.services.student_service import (
    create_student_post,
    respond_to_application,
    get_post_applications,
    get_student_post_history,
    update_student_profile,
    delete_student_post,
    # นำเข้าฟังก์ชัน Wallet จาก Service
    get_student_wallet, 
    get_wallet_transactions, 
    process_deposit, 
    process_withdraw
)
from backend.utils.auth_helper import token_required, role_required

student_bp = Blueprint('student', __name__)

# ==========================================
# ระบบจัดการโพสต์และโปรไฟล์
# ==========================================

# POST /student/post — สร้างประกาศหาติวเตอร์ใหม่
@student_bp.route('/post', methods=['POST'])
@token_required
@role_required('student')
def add_post():
    data = request.get_json()
    subject         = data.get('subject')
    grade_level     = data.get('grade_level')
    learning_format = data.get('learning_format')
    location        = data.get('location')
    preferred_time  = data.get('preferred_time')
    description     = data.get('description')
    budget          = data.get('budget')

    if not all([subject, grade_level, learning_format, location, budget]):
        return jsonify({"status": "error", "message": "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน"}), 400

    result = create_student_post(
        user_id=request.user_id,
        subject=subject,
        grade_level=grade_level,
        learning_format=learning_format,
        location=location,
        preferred_time=preferred_time,
        description=description,
        budget=budget,
    )
    status_code = 201 if result["status"] == "success" else 400
    return jsonify(result), status_code

# GET /student/posts — ดูประวัติโพสต์ของนักเรียน
@student_bp.route('/posts', methods=['GET'])
@token_required
@role_required('student')
def get_posts():
    result = get_student_post_history(user_id=request.user_id)
    return jsonify(result), 200

# POST /student/respond — นักเรียนยอมรับหรือปฏิเสธใบสมัครของติวเตอร์
@student_bp.route('/respond', methods=['POST'])
@token_required
@role_required('student')
def respond():
    data = request.get_json()
    app_id = data.get('app_id')
    action = data.get('action')  # 'accept' | 'reject'

    if not all([app_id, action]):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400

    result = respond_to_application(app_id=app_id, user_id=request.user_id, action=action)
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code

# GET /student/applications/<post_id> — ดูรายชื่อผู้สมัครของโพสต์หนึ่ง
@student_bp.route('/applications/<int:post_id>', methods=['GET'])
@token_required
@role_required('student')
def view_applications(post_id):
    result = get_post_applications(post_id=post_id, user_id=request.user_id)
    return jsonify(result), 200

# POST /student/profile/update — อัปเดตโปรไฟล์นักเรียน
@student_bp.route('/profile/update', methods=['POST'])
@token_required
@role_required('student')
def update_profile():
    data = request.get_json()
    school_name     = data.get('school_name')
    education_level = data.get('education_level')
    
    result = update_student_profile(
        user_id=request.user_id,
        school_name=school_name,
        education_level=education_level
    )
    return jsonify(result), 200 if result["status"] == "success" else 400

# DELETE /student/post/<post_id> — ลบโพสต์
@student_bp.route('/post/<int:post_id>', methods=['DELETE'])
@token_required
@role_required('student')
def delete_post(post_id):
    result = delete_student_post(
        user_id=request.user_id,
        post_id=post_id
    )
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code


# ==========================================
# ระบบ Wallet สำหรับนักเรียน
# ==========================================

# GET /student/api/wallet — ดึงข้อมูลกระเป๋าเงิน
@student_bp.route('/api/wallet', methods=['GET'])
@token_required
@role_required('student')
def get_wallet():
    result = get_student_wallet(request.user_id)
    return jsonify(result), 200

# GET /student/api/wallet/transactions — ดึงประวัติทำรายการ
@student_bp.route('/api/wallet/transactions', methods=['GET'])
@token_required
@role_required('student')
def get_transactions():
    result = get_wallet_transactions(request.user_id)
    return jsonify(result), 200

# POST /student/api/wallet/deposit — ฝากเงิน
@student_bp.route('/api/wallet/deposit', methods=['POST'])
@token_required
@role_required('student')
def deposit_money():
    data = request.get_json()
    amount = data.get('amount')
    note = data.get('note', 'ฝากเงินเข้า Wallet')
    
    if not amount or float(amount) <= 0:
        return jsonify({"status": "error", "message": "จำนวนเงินไม่ถูกต้อง"}), 400
        
    result = process_deposit(request.user_id, amount, note)
    return jsonify(result), 200 if result['status'] == 'success' else 400

# POST /student/api/wallet/withdraw — ถอนเงิน
@student_bp.route('/api/wallet/withdraw', methods=['POST'])
@token_required
@role_required('student')
def withdraw_money():
    data = request.get_json()
    amount = data.get('amount')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')
    note = data.get('note', '')
    
    if not all([amount, bank_name, account_number]) or float(amount) <= 0:
        return jsonify({"status": "error", "message": "กรุณากรอกข้อมูลให้ครบถ้วน"}), 400
        
    result = process_withdraw(request.user_id, amount, bank_name, account_number, note)
    return jsonify(result), 200 if result['status'] == 'success' else 400