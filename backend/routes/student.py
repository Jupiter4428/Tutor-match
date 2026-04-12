from flask import Blueprint, request, jsonify
from backend.services.student_service import create_student_post

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