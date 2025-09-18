from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import cors_origins, cors_allow_credentials
from .api.v1.routes import router as api_router

app = FastAPI(title="IdeaBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=cors_allow_credentials(),
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

app.include_router(api_router)
