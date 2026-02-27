from app.models.base import BaseModel


class Amenity(BaseModel):
    def __init__(self, name):
        super().__init__()
        if not name.strip():
            raise ValueError("Amenity name cannot be empty")
        self.name = name[:50]
        self.places = []

    def add_to_place(self, place):
        if place not in self.places:
            self.places.append(place)
            place.add_amenity(self)
