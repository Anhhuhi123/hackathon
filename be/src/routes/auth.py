from fastapi import APIRouter, Depends, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from src.utils.database import get_db
from src.services.auth_service import AuthService, AuthException

router = APIRouter()

class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="Email or username")
    password: str = Field(..., min_length=1)
    remember_me: bool = False

@router.post("/login")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    
    # Standardize identifier (lowercase)
    identifier = payload.identifier.strip().lower()
    
    auth_service = AuthService(db)
    
    try:
        access_token, refresh_token, max_age, user_dict = await auth_service.login(
            identifier=identifier,
            password=payload.password,
            remember_me=payload.remember_me,
            ip_address=ip_address
        )
        
        # Set cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            path="/api/v1/auth/refresh",
            max_age=max_age
        )
        
        return {
            "access_token": access_token,
            "user": user_dict
        }
        
    except AuthException as e:
        content = {
            "error": e.error,
            "message": e.message
        }
        if e.fields:
            content["fields"] = e.fields
        if e.extra:
            content.update(e.extra)
            
        return JSONResponse(status_code=e.status_code, content=content)

# We also need a generic exception handler for Validation errors 
# That should ideally go in main.py, so it catches FastAPI's RequestValidationError
