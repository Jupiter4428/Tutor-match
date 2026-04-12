from flask import Blueprint, request, jsonify
from backend.services.student_service import create_student_post, respond_to_application, get_post_applications, get_student_post_history
student_bp = Blueprint('student', __name__)

@student_bp.route('/post', methods=['POST'])
def add_post():
    data = request.json
    
    # ตรวจสอบข้อมูลเบื้องต้น
    if not all(k in data for k in ('student_id', 'subject', 'budget')):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = create_student_post(
        student_id=data['student_id'],
        subject=data['subject'],
        description=data.get('description', ''),
        budget=data['budget']
    )
    return jsonify(result)

@student_bp.route('/respond', methods=['POST'])
def respond_application():
    data = request.json
    
    # เช็คว่าส่งข้อมูลมาครบ 3 อย่างไหม
    if not all(k in data for k in ('app_id', 'student_id', 'action')):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = respond_to_application(
        app_id=data['app_id'],
        student_id=data['student_id'],
        action=data['action']
    )
    
    return jsonify(result)

@student_bp.route('/applications/<int:post_id>', methods=['GET'])
def view_applications(post_id):
    # ดึง student_id จาก URL (?student_id=1)
    student_id = request.args.get('student_id')
    
    if not student_id:
        return jsonify({"status": "error", "message": "กรุณาระบุ student_id"}), 400
        
    result = get_post_applications(post_id, student_id)
    
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 403
    
# Route สำหรับให้นักเรียนดูประวัติโพสต์ของตัวเอง
@student_bp.route('/my-posts', methods=['GET'])
def view_my_posts():
    # ดึง student_id จาก URL เช่น ?student_id=1
    student_id = request.args.get('student_id')
    
    if not student_id:
        return jsonify({"status": "error", "message": "กรุณาระบุ student_id"}), 400
        
    result = get_student_post_history(student_id)
    
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500