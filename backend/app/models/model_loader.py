from transformers import pipeline
import torch

class summarizer:
    def __init__(self):
        device = -1  #Ye Torch ko cpu pe run krwane ke liye

        self.model = pipeline("summarization",
                              model= "sshleifer/distilbart-cnn-12-6",
                              device = device)
    
    def clean_text(self, text):  # Text clean krenge sirf space hata re hai
        return " ".join(text.split())
    
    def chunk_text(self, text, max_words=400):  # Jo model chose kiya hai uski size kam hai to 400 words ki limit mai word lenge
        words = text.split()
        for i in range(0, len(words), max_words):
            yield " ".join(words[i:i + max_words])

    def generate_summary(self, text, min_len=30, max_len=120):  # Summary bnyge 
        cleaned = self.clean_text(text)
        summaries = []

        for chunk in self.chunk_text(cleaned): # Chunks mai save rkha tha na toh unko ab combine krna hai aur summary bnani hai
            result = self.model(
                chunk,
                min_length=min_len,
                max_length=max_len,
                do_sample=False
            )[0]["summary_text"]

            summaries.append(result)

        return " ".join(summaries)