from flask_restx import Namespace, Resource, fields
from app.services import facade

api = Namespace('reviews', description='Review operations')

review_model = api.model('Review', {
    'text': fields.String(required=True),
    'rating': fields.Integer(required=True),
    'user_id': fields.String(required=True),
    'place_id': fields.String(required=True)
})

update_review_model = api.model('UpdateReview', {
    'text': fields.String(),
    'rating': fields.Integer()
})


@api.route('/')
class ReviewList(Resource):

    @api.expect(review_model)
    def post(self):
        """Create a new review"""
        review_data = api.payload

        try:
            review = facade.create_review(review_data)
        except ValueError as e:
            return {'error': str(e)}, 400

        return {
            'id': review.id,
            'text': review.text,
            'rating': review.rating,
            'user_id': review.user.id,
            'place_id': review.place.id
        }, 201

    def get(self):
        """Retrieve a list of all reviews"""
        reviews = facade.get_all_reviews()
        return [
            {
                'id': r.id,
                'text': r.text,
                'rating': r.rating
            } for r in reviews
        ], 200


@api.route('/<review_id>')
class ReviewResource(Resource):

    def get(self, review_id):
        """Get review details by ID"""
        review = facade.get_review(review_id)
        if not review:
            return {'error': 'Review not found'}, 404

        return {
            'id': review.id,
            'text': review.text,
            'rating': review.rating,
            'user_id': review.user.id,
            'place_id': review.place.id
        }, 200

    @api.expect(update_review_model)
    def put(self, review_id):
        """Update a review's information"""
        review_data = api.payload

        try:
            review = facade.update_review(review_id, review_data)
        except ValueError as e:
            return {'error': str(e)}, 400

        if not review:
            return {'error': 'Review not found'}, 404

        return {'message': 'Review updated successfully'}, 200

    def delete(self, review_id):
        """Delete a review by ID"""
        review = facade.delete_review(review_id)
        if not review:
            return {'error': 'Review not found'}, 404

        return {'message': 'Review deleted successfully'}, 200
