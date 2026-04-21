# app.py
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.config import SECRET_KEY

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    CORS(app)

    #register static routes
    @app.route("/")
    def index():
        return send_from_directory("../frontend/auth", "login.html")

    @app.route("/login")
    def login_page():
        return send_from_directory("../frontend/auth", "login.html")

    @app.route("/register")
    def register_page():
        return send_from_directory("../frontend/auth", "register.html")
    
    @app.route("/home/admin")
    def admin_home():
        return send_from_directory("../frontend/admin", "home_admin.html")

    @app.route("/home/student")
    def student_home():
        return send_from_directory("../frontend/student", "home_student.html")
    
    @app.route("/home/tutor")
    def tutor_home():
        return send_from_directory("../frontend/tutor", "home_tutor.html")
    
    # ฟังก์ชันสำหรับส่งหน้าเว็บแก้ไขโปรไฟล์ของนักเรียน
    @app.route("/profile/student/edit")
    def student_profile_edit_page():
        return send_from_directory("../frontend/student", "edit_profile_student.html")
    
    # register blueprint
    from backend.routes.auth import auth_bp
    from backend.routes.student import student_bp
    from backend.routes.tutor import tutor_bp
    
    # อิงตาม auth, student, tutor ตรงๆ
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(student_bp, url_prefix='/student')
    app.register_blueprint(tutor_bp, url_prefix='/tutor')

    return app
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)