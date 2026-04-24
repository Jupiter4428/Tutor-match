from flask import Blueprint, request, jsonify
from backend.utils.auth_helper import token_required, role_required
from backend.services.review_service import (
    get_all_reviews,
    get_reviews_by_tutor,
    get_reviewable_applications,
    create_review,
    delete_review,
    get_rating_summary
)

review_bp = Blueprint("review", __name__)


@review_bp.route("", methods=["GET"])
def list_reviews():
    tutor_id = request.args.get("tutor_id", type=int)
    rating = request.args.get("rating", type=int)
    subject = request.args.get("subject", type=str)
    search = request.args.get("search", type=str)

    result = get_all_reviews(
        tutor_id=tutor_id,
        rating=rating,
        subject=subject,
        search=search
    )
    return jsonify(result), 200


@review_bp.route("/summary", methods=["GET"])
def summary():
    tutor_id = request.args.get("tutor_id", type=int)
    result = get_rating_summary(tutor_id=tutor_id)
    return jsonify(result), 200


@review_bp.route("/tutor/<int:tutor_id>", methods=["GET"])
def tutor_reviews(tutor_id):
    rating = request.args.get("rating", type=int)
    subject = request.args.get("subject", type=str)
    search = request.args.get("search", type=str)

    result = get_reviews_by_tutor(
        tutor_id=tutor_id,
        rating=rating,
        subject=subject,
        search=search
    )
    return jsonify(result), 200


@review_bp.route("/tutor/<int:tutor_id>/summary", methods=["GET"])
def tutor_summary(tutor_id):
    result = get_rating_summary(tutor_id=tutor_id)
    return jsonify(result), 200


@review_bp.route("/my-options", methods=["GET"])
@token_required
@role_required("student")
def my_reviewable_options():
    result = get_reviewable_applications(request.user_id)
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code


@review_bp.route("", methods=["POST"])
@token_required
@role_required("student")
def add_review():
    data = request.get_json()
    app_id = data.get("app_id")
    rating = data.get("rating")
    comment = data.get("comment", "").strip()

    if not app_id or not rating:
        return jsonify({
            "status": "error",
            "message": "กรุณากรอก app_id และ rating"
        }), 400

    if rating not in [1, 2, 3, 4, 5]:
        return jsonify({
            "status": "error",
            "message": "rating ต้องอยู่ระหว่าง 1-5"
        }), 400

    result = create_review(
        user_id=request.user_id,
        app_id=app_id,
        rating=rating,
        comment=comment
    )
    status_code = 201 if result["status"] == "success" else 400
    return jsonify(result), status_code


@review_bp.route("/<int:review_id>", methods=["DELETE"])
@token_required
@role_required("student")
def remove_review(review_id):
    result = delete_review(request.user_id, review_id)
    status_code = 200 if result["status"] == "success" else 400
    return jsonify(result), status_code
