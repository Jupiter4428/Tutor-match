# app.py
from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.config import SECRET_KEY, ALLOWED_ORIGINS
from backend.routes.admin import admin_bp
from backend.routes.auth import auth_bp
from backend.routes.student import student_bp
from backend.routes.tutor import tutor_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

    # register html routes
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

    @app.route("/profile/tutor")
    def tutor_profile():
        return send_from_directory("../frontend/tutorprofile", "profile.html")

    @app.route("/profile/tutor/edit")
    def tutor_profile_edit():
        return send_from_directory("../frontend/tutorprofile", "edit.html")

    # จัดการไฟล์ย่อยๆ ทั้งหมด (CSS, JS, รูปภาพ)
    @app.route("/assets/<path:filepath>")
    def serve_assets(filepath):
        return send_from_directory("../frontend", filepath)
    
    # # register js routes
    # @app.route("/<filename>.js")
    # def serve_root_js(filename):
    #     return send_from_directory("../frontend/auth", f"{filename}.js")
    
    # @app.route("/<filename>.js")
    # def serve_root_js(filename):
    #     return send_from_directory("../frontend/admin", f"{filename}.js")
    
    # @app.route("/<filename>.js")
    # def serve_root_js(filename):
    #     return send_from_directory("../frontend/student", f"{filename}.js")
    
    # @app.route("/<filename>.js")
    # def serve_root_js(filename):
    #     return send_from_directory("../frontend/tutor", f"{filename}.js")
    
    # @app.route("/<filename>.js")
    # def serve_root_js(filename):
    #     return send_from_directory("../frontend/tutorprofile", f"{filename}.js")  
      
    # # register css routes
    # @app.route("/<filename>.css")
    # def serve_root_css(filename):
    #     return send_from_directory("../frontend/auth", f"{filename}.css")
    
    # @app.route("/<filename>.css")
    # def serve_root_css(filename):
    #     return send_from_directory("../frontend/admin", f"{filename}.css")
    
    # @app.route("/<filename>.css")
    # def serve_root_css(filename):
    #     return send_from_directory("../frontend/student", f"{filename}.css")
    
    # @app.route("/<filename>.css")
    # def serve_root_css(filename):
    #     return send_from_directory("../frontend/tutor", f"{filename}.css")
    
    # @app.route("/<filename>.css")
    # def serve_root_css(filename):
    #     return send_from_directory("../frontend/tutorprofile", f"{filename}.css")
    

    
    
    # register blueprint
    from backend.routes.auth import auth_bp
    from backend.routes.student import student_bp
    from backend.routes.tutor import tutor_bp
    
    # อิงตาม auth, student, tutor ตรงๆ
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(student_bp, url_prefix='/student')
    app.register_blueprint(tutor_bp, url_prefix='/tutor')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)