from flask import Blueprint, request, jsonify
from backend.services.tutor_service import apply_for_job

tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route('/apply', methods=['POST'])
def apply_job():
    data = request.json
    
    if not all(k in data for k in ('post_id', 'tutor_id')):
        return jsonify({"status": "error", "message": "ข้อมูลไม่ครบถ้วน"}), 400
        
    result = apply_for_job(
        post_id=data['post_id'],
        tutor_id=data['tutor_id']
    )
    
    # ถ้า Error ส่ง Status Code 400, ถ้าสำเร็จส่ง 201
    status_code = 400 if result['status'] == 'error' else 201
    return jsonify(result), status_code