from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend_py.api import groups, sessions, users

app = FastAPI(title="StudySync API", description="Python FastAPI Migration for StudySync Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "StudySync API is running"}
