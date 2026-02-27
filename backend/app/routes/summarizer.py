# backend/app/routes/summarize.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.summarizer import summarize_text

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/summarize")
def summarize(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")
    
    summary = summarize_text(request.text)
    return {"summary": summary}