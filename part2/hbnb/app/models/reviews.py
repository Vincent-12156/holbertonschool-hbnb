from app.models.base import BaseModel
from app.models.users import User
from app.models.places import Place


class Review(BaseModel):
    def __init__(self, text, rating, place, user):
        super().__init__()
        self.text = text
        self.rating = int(rating)
        self.place = place
        self.user = user

        if not text.strip():
            raise ValueError("Review text cannot be empty")
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")
        if not isinstance(place, Place):
            raise ValueError("Invalid place")
        if not isinstance(user, User):
            raise ValueError("Invalid user")

        place.add_review(self)
        user.add_review(self)
