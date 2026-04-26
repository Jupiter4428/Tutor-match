# app.py
from flask import Flask, send_from_directory, g
from flask_cors import CORS
from backend.config import SECRET_KEY, ALLOWED_ORIGINS


def create_app():
    app = Flask(
        __name__,
        static_folder="../static",
        static_url_path="/static"
    )
    app.config["SECRET_KEY"] = SECRET_KEY

    CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

    # ปิด DB connection จริงเมื่อจบทุก request
    # (service files เรียก connection.close() แต่เป็น no-op — ปิดที่นี่แทน)
    @app.teardown_appcontext
    def close_db_connection(_exception=None):
        wrapped = g.pop('_db_wrapped', None)
        if wrapped is not None:
            wrapped.force_close()

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
    
    @app.route("/student/courses")
    def stu_courses():
        return send_from_directory("../frontend/student", "my_courses.html")

    @app.route("/student/wallet")
    def student_wallet_page():
        return send_from_directory("../frontend/student", "wallet.html")
    
    @app.route("/home/student/reviews")
    def student_review_page():
        return send_from_directory("../frontend/tutorprofile", "review.html")
    
    @app.route("/home/tutor")
    def tutor_home():
        return send_from_directory("../frontend/tutor", "home_tutor.html")

    @app.route('/profile/tutor')
    def tutor_profile():
        return send_from_directory("../frontend/tutorprofile", "profile.html")

    @app.route('/profile/tutor/reviews')
    def tutor_profile_reviews():
        return send_from_directory("../frontend/tutorprofile", "review.html")

    @app.route('/frontend/tutorprofile/<path:filename>')
    def tutorprofile_assets(filename):
        return send_from_directory("../frontend/tutorprofile", filename)

    @app.route("/profile/tutor/edit")
    def tutor_profile_edit():
        return send_from_directory("../frontend/tutorprofile", "edit.html")

    @app.route("/tutor/wallet")
    def tutor_wallet_page():
        return send_from_directory("../frontend/tutor", "tutor_wallet.html")
    
    # จัดการไฟล์ย่อยๆ ทั้งหมด (CSS, JS, รูปภาพ)
    @app.route("/assets/<path:filepath>")
    def serve_assets(filepath):
        return send_from_directory("../frontend", filepath)
    
    # register blueprint
    from backend.routes.admin import admin_bp
    from backend.routes.auth import auth_bp
    from backend.routes.student import student_bp
    from backend.routes.tutor import tutor_bp
    from backend.routes.review import review_bp

    # อิงตาม auth, student, tutor ตรงๆ
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(student_bp, url_prefix='/student')
    app.register_blueprint(tutor_bp, url_prefix='/tutor')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(review_bp, url_prefix="/reviews")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
