from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import facade
import logging

api = Namespace("reviews", description="Review operations")

review_model = api.model(
    "Review",
    {
        "text": fields.String(required=True, description="Text of the review"),
        "rating": fields.Integer(required=True, description="Rating of the place (1-5)"),
        "place_id": fields.String(required=True, description="ID of the place"),
    },
)

update_review_model = api.model(
    "UpdateReview",
    {
        "text": fields.String(description="Text of the review"),
        "rating": fields.Integer(description="Rating of the place (1-5)"),
    },
)


@api.route("/")
class ReviewList(Resource):
    @api.expect(review_model, validate=True)
    @api.response(201, "Review successfully created")
    @api.response(400, "Invalid input data")
    
    @jwt_required()
    def post(self):
        """Register a new review"""
        # data = api.payload
        data = request.get_json()
        logging.info(f"Received review data: {data}")
        user_id = get_jwt_identity()
        
        data["user_id"] = user_id
        
        try:
            review = facade.create_review(data)
        except ValueError as e:
            return {"error": str(e)}, 400

        return review.to_dict(), 201

    @api.response(200, "List of reviews retrieved successfully")
    def get(self):
        """Retrieve a list of all reviews"""
        reviews = facade.get_all_reviews()
        return [{"id": r.id, "text": r.text, "rating": r.rating} for r in reviews], 200


@api.route("/<review_id>")
class ReviewResource(Resource):
    @api.response(200, "Review details retrieved successfully")
    @api.response(404, "Review not found")

    def get(self, review_id):
        """Get review details by ID"""
        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404
        return review.to_dict(), 200

    @api.expect(update_review_model, validate=True)
    @api.response(200, "Review updated successfully")
    @api.response(404, "Review not found")
    @api.response(400, "Invalid input data")
    
    @jwt_required()
    def put(self, review_id):
        """Update a review's information"""
        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404

        user_id = get_jwt_identity()
        claims = get_jwt()
        is_admin = claims.get("is_admin", False)

        if str(review.user_id) != str(user_id) and not is_admin:
            return {"error": "Unauthorized"}, 403

        try:
            updated = facade.update_review(review_id, api.payload)
        except ValueError as e:
            return {"error": str(e)}, 400

        return {
            "message": "Review updated successfully",
            "review": updated.to_dict()
        }, 200

    @api.response(200, "Review deleted successfully")
    @api.response(404, "Review not found")

    @jwt_required()
    def delete(self, review_id):
        """Delete a review"""
        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404

        user_id = get_jwt_identity()
        claims = get_jwt()
        is_admin = claims.get("is_admin", False)

        if str(review.user_id) != str(user_id) and not is_admin:
            return {"error": "Unauthorized"}, 403

        facade.delete_review(review_id)
        return {"message": "Review deleted successfully"}, 200
