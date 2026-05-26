import os
import sys
from dotenv import load_dotenv

# Add the current directory to path so imports work
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

load_dotenv()

from src.models.user import User
from src.utils.security import hash_password
from src.utils.database import SessionLocal

def create_user(email, username, password):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing_user:
            print(f"User with email '{email}' or username '{username}' already exists.")
            return

        hashed = hash_password(password)
        new_user = User(
            email=email,
            username=username,
            password_hash=hashed
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Successfully created user: {username} ({email})")
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Create a test user in the database")
    parser.add_argument("--email", required=True, help="Email of the user")
    parser.add_argument("--username", required=True, help="Username of the user")
    parser.add_argument("--password", required=True, help="Password of the user")
    
    args = parser.parse_args()
    create_user(args.email, args.username, args.password)
