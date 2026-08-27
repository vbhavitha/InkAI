from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth_schema import RegisterRequest, LoginRequest
from app.database.database import get_db
from app.services.auth_service import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    user: RegisterRequest,
    db: Session = Depends(get_db)
):

    if user.password != user.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    result = register_user(
        user,
        db
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result

@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):

    result = login_user(
        user,
        db
    )

    if not result["success"]:
        raise HTTPException(
            status_code=401,
            detail=result["message"]
        )

    return result