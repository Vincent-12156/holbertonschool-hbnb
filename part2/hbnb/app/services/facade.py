from app.persistence.repository import InMemoryRepository
from app.models.users import User
from app.models.amenities import Amenity
from app.models.places import Place
from app.models.reviews import Review


class HBnBFacade:
    def __init__(self):
        self.user_repo = InMemoryRepository()
        self.place_repo = InMemoryRepository()
        self.review_repo = InMemoryRepository()
        self.amenity_repo = InMemoryRepository()

    def create_user(self, user_data):
        user = User(**user_data)
        self.user_repo.add(user)
        return user

    def get_user(self, user_id):
        return self.user_repo.get(user_id)

    def get_user_by_email(self, email):
        return self.user_repo.get_by_attribute('email', email)

    def get_all_users(self):
        return self.user_repo.get_all()

    def update_user(self, user_id, user_data):
        updated_user = self.user_repo.update(user_id, user_data)
        return updated_user

    def create_amenity(self, amenity_data):
        amenity = Amenity(**amenity_data)
        self.amenity_repo.add(amenity)
        return amenity

    def get_amenity(self, amenity_id):
        return self.amenity_repo.get(amenity_id)

    def get_all_amenities(self):
        return self.amenity_repo.get_all()

    def update_amenity(self, amenity_id, amenity_data):
        updated_amenity = self.amenity_repo.update(amenity_id, amenity_data)
        return updated_amenity

    def create_place(self, place_data):
        owner = self.get_user(place_data['owner_id'])
        if not owner:
            raise ValueError("Owner not found")

        place = Place(
            title=place_data['title'],
            description=place_data.get('description', ''),
            price=place_data['price'],
            latitude=place_data['latitude'],
            longitude=place_data['longitude'],
            owner=owner
        )

        for amenity_id in place_data.get('amenities', []):
            amenity = self.get_amenity(amenity_id)
            if not amenity:
                raise ValueError(f"Amenity {amenity_id} not found")
            place.add_amenity(amenity)

        self.place_repo.add(place)
        return place

    def place_to_dict(self, place, detailed=False):
        data = {
            'id': place.id,
            'title': place.title,
            'description': place.description,
            'price': place.price,
            'latitude': place.latitude,
            'longitude': place.longitude,
        }

        if detailed:
            data['owner'] = {
                'id': place.owner.id,
                'first_name': place.owner.first_name,
                'last_name': place.owner.last_name,
                'email': place.owner.email
            }

            data['amenities'] = [
                {'id': a.id, 'name': a.name}
                for a in place.amenities
            ]

            data['reviews'] = [
                {
                    'id': r.id,
                    'text': r.text,
                    'rating': r.rating,
                    'user_id': r.user.id
                }
                for r in place.reviews
            ]
        else:
            data['owner_id'] = place.owner.id

        return data

    def get_place(self, place_id):
        return self.place_repo.get(place_id)

    def get_all_places(self):
        return self.place_repo.get_all()

    def update_place(self, place_id, place_data):
        place = self.get_place(place_id)
        if not place:
            return None

        if 'title' in place_data:
            place.title = place_data['title']

        if 'description' in place_data:
            place.description = place_data['description']

        if 'price' in place_data:
            place.price = place_data['price']

        if 'latitude' in place_data:
            place.latitude = place_data['latitude']

        if 'longitude' in place_data:
            place.longitude = place_data['longitude']

        if 'amenities' in place_data:
            place.amenities = []
            for amenity_id in place_data['amenities']:
                amenity = self.get_amenity(amenity_id)
                if not amenity:
                    raise ValueError(f"Amenity {amenity_id} not found")
                place.add_amenity(amenity)

        return place

    def create_review(self, review_data):
        user = self.get_user(review_data['user_id'])
        if not user:
            raise ValueError("User not found")

        place = self.get_place(review_data['place_id'])
        if not place:
            raise ValueError("Place not found")

        rating = review_data['rating']

        review = Review(
            text=review_data['text'],
            rating=rating,
            user=user,
            place=place
        )

        self.review_repo.add(review)
        return review

    def get_review(self, review_id):
        return self.review_repo.get(review_id)

    def get_all_reviews(self):
        return self.review_repo.get_all()

    def get_reviews_by_place(self, place_id):
        place = self.get_place(place_id)
        if not place:
            return None
        return place.reviews

    def update_review(self, review_id, review_data):
        review = self.get_review(review_id)
        if not review:
            return None

        if 'text' in review_data:
            review.text = review_data['text']

        if 'rating' in review_data:
            rating = review_data['rating']
            if not (1 <= rating <= 5):
                raise ValueError("Rating must be between 1 and 5")
            review.rating = rating

        return review

    def delete_review(self, review_id):
        review = self.get_review(review_id)
        if not review:
            return None

        review.place.reviews.remove(review)
        review.user.reviews.remove(review)
        self.review_repo.delete(review_id)

        return review
