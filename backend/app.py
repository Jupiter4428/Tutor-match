from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.config import SECRET_KEY

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    CORS(app)

    # serve frontend files
    @app.route("/")
    def index():
        return send_from_directory("../frontend/auth", "login.html")

    @app.route("/login")
    def login_page():
        return send_from_directory("../frontend/auth", "login.html")

    @app.route("/register")
    def register_page():
        return send_from_directory("../frontend/auth", "register.html")

    # register blueprint
    from backend.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    return app