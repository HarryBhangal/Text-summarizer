# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.summarizer import router

app = FastAPI()

# This allows your browser extension to talk to the server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this later for security
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"status": "running"}