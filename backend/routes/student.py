# student_routes.py
from flask import Blueprint, request, jsonify
from backend.services.student_service import (
    create_student_post,
    respond_to_application,
    get_post_applications,
    get_student_post_history,
    update_student_profile,
)
from backend.utils.auth_helper import token_required, role_required

student_bp = Blueprint('student', __name__)


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

    result = update_student_profile(request.user_id, school_name, education_level)
    status_code = 200 if result['status'] == 'success' else 400
    return jsonify(result), status_code