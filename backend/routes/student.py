from flask import Blueprint, request, jsonify
from backend.services.student_service import create_student_post, respond_to_application, get_post_applications, get_student_post_history
student_bp = Blueprint('student', __name__)

@student_bp.route('/post', methods=['POST'])
def add_post():
    data = request.get_json()
    
    # 1. หน้าบ้านส่งมาในชื่อ student_id (แต่จริงๆ ตอนนี้มันคือ user_id แล้ว)
    client_user_id = data.get('student_id') 
    subject = data.get('subject')
    description = data.get('description')
    budget = data.get('budget')

    # 2. เรียกใช้ฟังก์ชัน และเปลี่ยนชื่อตัวแปรเป็น user_id= client_user_id ให้ตรงกับ Service
    result = create_student_post(
        user_id=client_user_id, 
        subject=subject,
        description=description,
        budget=budget
    )

    if result["status"] == "success":
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@student_bp.route('/respond', methods=['POST'])
def respond():
    data = request.get_json()
    # หน้าบ้านส่ง student_id มา (ซึ่งคือ user_id ของสมชาย)
    result = respond_to_application(
        app_id=data.get('app_id'),
        user_id=data.get('student_id'), # ส่งเข้าตัวแปร user_id
        action=data.get('action')
    )
    return jsonify(result), 200

@student_bp.route('/applications/<int:post_id>', methods=['GET'])
def view_applications(post_id):
    # รับค่า student_id จากหน้าบ้าน (ซึ่งคือ user_id)
    user_id = request.args.get('student_id')
    
    # ส่งเข้า Service โดยระบุชื่อตัวแปร user_id=...
    result = get_post_applications(post_id=post_id, user_id=user_id)
    return jsonify(result), 200
    
@student_bp.route('/history', methods=['GET'])
def get_history():
    # รับค่า student_id จาก URL (ซึ่งหน้าบ้านส่ง user_id มาในชื่อนี้)
    user_id = request.args.get('student_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "Missing ID"}), 400
        
    # เรียกใช้ฟังก์ชันที่เราเพิ่งแก้ (ส่งเข้าตัวแปร user_id)
    result = get_student_post_history(user_id=user_id)
    return jsonify(result), 200
