from app.models.base import BaseModel
from app.models.users import User


class Place(BaseModel):
    def __init__(self, title, description, price, latitude, longitude, owner):
        super().__init__()

        self.title = title[:100]
        self.description = description
        self.price = float(price)
        self.latitude = float(latitude)
        self.longitude = float(longitude)
        self.owner = owner
        self.reviews = []
        self.amenities = []

        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        if not description or not description.strip():
            raise ValueError("Description cannot be empty")
        if self.price < 0:
            raise ValueError("Price must be positive")
        if not (-90.0 <= self.latitude <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180.0 <= self.longitude <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")
        if not isinstance(owner, User):
            raise ValueError("Owner must be a User instance")

    def add_review(self, review):
        self.reviews.append(review)

    def add_amenity(self, amenity):
        self.amenities.append(amenity)
