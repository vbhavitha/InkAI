from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=64
    )

    confirm_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=64
    )

    confirm_password: str

class GoogleLoginRequest(BaseModel):
    token: str