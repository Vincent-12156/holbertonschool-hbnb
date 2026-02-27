from app.models.base import BaseModel
import re


class User(BaseModel):
    def __init__(self, first_name, last_name, email, is_admin=False):
        super().__init__()
        self.first_name = first_name[:50]
        self.last_name = last_name[:50]
        self.email = email
        self.is_admin = is_admin
        self.places = []
        self.reviews = []

        if not first_name.strip():
            raise ValueError("first_name cannot be empty")
        if not last_name.strip():
            raise ValueError("last_name cannot be empty")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Invalid email format")

    def add_place(self, place):
        self.places.append(place)

    def add_review(self, review):
        self.reviews.append(review)
