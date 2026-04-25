# routes.auth.py
from flask import Blueprint, request, jsonify
from backend.services.auth_service import register_user, login_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # รับค่าจาก frontend
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    # รวมชื่อ
    name = f"{first_name} {last_name}".strip()

    # เช็คข้อมูลครบไหม
    if not all([first_name, last_name, email, password, role]):
        return jsonify({
            "status": "error",
            "message": "กรอกข้อมูลไม่ครบ"
        }), 400

    # เช็ค role ถูกต้องไหม
    if role not in ("student", "tutor"):
        return jsonify({
            "status": "error",
            "message": "role ไม่ถูกต้อง"
        }), 400

    # เรียก service
    result = register_user(name, email, password, role)

    if result["status"] == "success":
        return jsonify(result), 201
    else:
        return jsonify(result), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"status": "error", "message": "กรอกข้อมูลไม่ครบ"}), 400

    result = login_user(email, password)

    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 401