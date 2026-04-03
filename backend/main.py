from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import chat, documents, sessions
from core.config import settings

app = FastAPI(
    title="SmartChat API",
    version="0.1.0",
)

# CORS Middleware
origins = settings.FRONTEND_URL.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, tags=["Chat"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(sessions.router, tags=["Sessions"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the SmartChat API"}
