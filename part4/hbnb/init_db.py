from app import create_app, db
import app.models

app = create_app()

with app.app_context():
    db.create_all()
    print("Database tables created!")
