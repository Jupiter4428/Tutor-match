# admin_routes.py
from flask import Blueprint, jsonify, request
from backend.utils.auth_helper import token_required, role_required
from backend.services.admin_service import (
    get_admin_stats,
    get_all_users,
    update_user_status,
    get_reports,
    update_report_status,
    verify_tutor,
    get_pending_tutors,
    hide_review,
    admin_delete_review
)

admin_bp = Blueprint('admin', __name__, url_prefix="/admin")


# ==========================================
# Dashboard & สถิติภาพรวม
# ==========================================

# GET /admin/stats — ดึงสถิติภาพรวมของระบบสำหรับ Admin Dashboard
@admin_bp.route("/stats", methods=["GET"])
@token_required
@role_required("admin")
def admin_stats():
    result = get_admin_stats()
    return jsonify(result), 200 if result["status"] == "success" else 500


# ==========================================
# จัดการผู้ใช้งาน
# ==========================================

# GET /admin/users — ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ
@admin_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def all_users():
    result = get_all_users()
    return jsonify(result), 200 if result["status"] == "success" else 500


# POST /admin/users/status — เปลี่ยนสถานะบัญชีผู้ใช้ (ban / suspend / active)
@admin_bp.route("/users/status", methods=["POST"])
@token_required
@role_required("admin")
def user_status():
    data = request.get_json()
    user_id = data.get("user_id")
    status = data.get("status")

    if not user_id or not status:
        return jsonify({"status": "error", "message": "ต้องส่ง user_id และ status"}), 400

    result = update_user_status(user_id, status)
    return jsonify(result), 200 if result["status"] == "success" else 500


# ==========================================
# จัดการรายงาน
# ==========================================

# GET /admin/reports — ดึงรายการรายงานทั้งหมด
@admin_bp.route("/reports", methods=["GET"])
@token_required
@role_required("admin")
def all_reports():
    result = get_reports()
    return jsonify(result), 200 if result["status"] == "success" else 500


# POST /admin/reports/<report_id>/status — อัปเดตสถานะรายงาน
@admin_bp.route("/reports/<int:report_id>/status", methods=["POST"])
@token_required
@role_required("admin")
def report_status(report_id):
    data = request.get_json()
    status = data.get("status")

    if status not in ("pending", "investigating", "resolved", "dismissed"):
        return jsonify({"status": "error", "message": "สถานะไม่ถูกต้อง"}), 400

    result = update_report_status(report_id, status)
    return jsonify(result), 200 if result["status"] == "success" else 500


# ==========================================
# จัดการ Tutor
# ==========================================

# POST /admin/tutors/verify — Admin อนุมัติหรือปฏิเสธ tutor
@admin_bp.route("/tutors/verify", methods=["POST"])
@token_required
@role_required("admin")
def tutor_verify():
    data = request.get_json()
    tutor_id = data.get("tutor_id")
    action = data.get("action")  # 'verified' | 'rejected'
    reject_reason = data.get("reject_reason", "")

    if not tutor_id or action not in ("verified", "rejected"):
        return jsonify({"status": "error", "message": "ต้องส่ง tutor_id และ action (verified/rejected)"}), 400

    result = verify_tutor(tutor_id, action, reject_reason, request.user_id)

    if result.get("not_found"):
        return jsonify(result), 404
    return jsonify(result), 200 if result["status"] == "success" else 500


# ==========================================
# จัดการรีวิว (Admin)
# ==========================================

# POST /admin/reviews/hide — ซ่อนรีวิว
@admin_bp.route("/reviews/hide", methods=["POST"])
@token_required
@role_required("admin")
def hide_review_route():
    data = request.get_json()
    review_id = data.get("review_id")
    if not review_id:
        return jsonify({"status": "error", "message": "ต้องส่ง review_id"}), 400
    result = hide_review(review_id)
    return jsonify(result), 200 if result["status"] == "success" else 404


# DELETE /admin/reviews/<review_id> — ลบรีวิวถาวร
@admin_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@token_required
@role_required("admin")
def delete_review_route(review_id):
    result = admin_delete_review(review_id)
    return jsonify(result), 200 if result["status"] == "success" else 404


# GET /admin/tutors/pending — ดึงรายชื่อ tutor ที่รอการอนุมัติ
@admin_bp.route("/tutors/pending", methods=["GET"])
@token_required
@role_required("admin")
def pending_tutors():
    result = get_pending_tutors()
    return jsonify(result), 200 if result["status"] == "success" else 500
