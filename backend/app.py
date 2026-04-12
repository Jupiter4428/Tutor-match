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
    
    # register blueprint
    from backend.routes.auth import auth_bp
    from backend.routes.tutor import tutor_bp
    from backend.routes.student import student_bp
    from backend.routes.admin import admin_bp
    from backend.routes.application import application_bp
    from backend.routes.payment import payment_bp
    from backend.routes.review import review_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(tutor_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(application_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(review_bp)
    
    return app