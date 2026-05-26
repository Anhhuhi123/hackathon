from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
from dotenv import load_dotenv

load_dotenv()

from src.routes.auth import router as auth_router
from src.routes.betting import router as betting_router
from src.models.base import Base
from src.models.betting import Wallet, Match, Market, Selection, BetQuote, BetQuoteSelection, Bet, BetSelection, IdempotencyKey
from src.utils.database import engine

from fastapi.middleware.cors import CORSMiddleware
import os

logging.basicConfig(level=logging.INFO)

# Optional: Ensure tables are created if not using alembic immediately
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hackathon API", version="1.0.0")

# Setup CORS
origins = os.getenv("CORS_ORIGINS", "").split(",")
origins = [o.strip() for o in origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Format standard validation errors to match contract:
    {
      "error": "VALIDATION_ERROR",
      "fields": {
        "identifier": "Trường này là bắt buộc", ...
      }
    }
    """
    fields = {}
    for error in exc.errors():
        field_name = error["loc"][-1] if len(error["loc"]) > 0 else "unknown"
        # We can map standard Pydantic messages or just return them
        msg = error["msg"]
        
        if error["type"] == "missing":
            msg = "Trường này là bắt buộc"
            
        fields[field_name] = msg

    return JSONResponse(
        status_code=400,
        content={
            "error": "VALIDATION_ERROR",
            "fields": fields
        }
    )

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(betting_router, prefix="/api/v1", tags=["betting"])

