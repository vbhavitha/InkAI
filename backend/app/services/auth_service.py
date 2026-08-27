from sqlalchemy.orm import Session

from app.models.user import User
from app.auth.security import hash_password
from app.auth.security import verify_password
from app.auth.jwt_handler import create_access_token


def register_user(user_data, db: Session):

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists"
        }

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Registration successful"
    }

def login_user(login_data, db: Session):

    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password"
        }

    if not verify_password(
        login_data.password,
        user.password
    ):
        return {
            "success": False,
            "message": "Invalid email or password"
        }

    token = create_access_token(
        {
            "user_id": str(user.id),
            "email": user.email
        }
    )

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "profile_image": user.profile_image,
            "subscription_type": user.subscription_type
        }
    }