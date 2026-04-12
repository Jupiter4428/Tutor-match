from flask import Blueprint, request, jsonify
from backend.services.tutor_service import apply_for_job, get_open_posts, get_tutor_applications
tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route('/apply', methods=['POST'])
def apply_job():
    data = request.json
    
    if not all(k in data for k in ('post_id', 'tutor_id')):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = apply_for_job(
            post_id=data['post_id'],
            user_id=data['tutor_id']  #เปลี่ยนจาก tutor_id= เป็น user_id= ให้ตรงกับ Service 
        )
    
    # ถ้า Error ส่ง Status Code 400, ถ้าสำเร็จส่ง 201
    status_code = 400 if result['status'] == 'error' else 201
    return jsonify(result), status_code

# เพิ่ม Route ใหม่สำหรับการดึงฟีดประกาศ
@tutor_bp.route('/posts', methods=['GET'])
def view_posts():
    result = get_open_posts()
    
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500
    
# Route สำหรับให้ติวเตอร์ดูประวัติการสมัครของตัวเอง (GET)
@tutor_bp.route('/applications', methods=['GET'])
def view_my_applications():
    # 1. รับค่าที่ส่งมาจาก URL ?tutor_id=...
    user_id = request.args.get('tutor_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "กรุณาระบุ tutor_id"}), 400
        
    # 2. เรียกใช้ฟังก์ชัน "ดึงประวัติ" (get_tutor_applications) 
    # ห้ามเรียก apply_for_job ในนี้นะครับ!
    result = get_tutor_applications(user_id=user_id)
    
    # 3. ส่งคำตอบกลับ
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500

