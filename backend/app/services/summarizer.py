# backend/app/services/summarizer.py

from app.models.model_loader import load_model  # adjust import path if needed

#tokenizer, model = load_model()

# def summarize_text(text: str) -> str:
#     inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    
#     summary_ids = model.generate(
#         inputs["input_ids"],
#         max_length=150,
#         min_length=40,
#         length_penalty=2.0,
#         num_beams=4,
#         early_stopping=True
#     )
    
#     summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
#     return summary