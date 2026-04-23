import jwt
from flask import request, jsonify
from functools import wraps
from backend.config import SECRET_KEY

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"status": "error", "message": "ไม่พบ token"}), 401

        try:
            parts = token.split(" ")
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({"status": "error", "message": "รูปแบบ token ไม่ถูกต้อง"}), 401
            payload = jwt.decode(parts[1], SECRET_KEY, algorithms=["HS256"])
            request.user_id = payload["user_id"]
            request.role = payload["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "token หมดอายุ"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "token ไม่ถูกต้อง"}), 401

        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.role not in roles:
                return jsonify({"status": "error", "message": "ไม่มีสิทธิ์เข้าถึง"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator