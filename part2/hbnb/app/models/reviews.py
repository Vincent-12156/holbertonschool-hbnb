from app.models.base import BaseModel

class Review(BaseModel):
    def __init__(self, text, rating, place, user):
        super().__init__()
        self.text = text
        self.rating = int(rating)
        self.place = place
        self.user = user

        if not (1 <= self.rating <= 5):
            raise ValueError("Rating must be between 1 and 5")

        place.add_review(self)
        user.add_review(self)
