from transformers import pipeline

summarizer = pipeline(
    "summarization",
    model="t5-small"
)

def generate_summary(text, min_len=20, max_len=70):
    return summarizer(
        text,
        min_length=min_len,
        max_length=max_len,
        do_sample=False
    )[0]["summary_text"]


text = """Please use the search box at the top of this page or the links to the right. 
Feel free to subscribe to our syndicated feeds.
To fulfill the free license requirements, please read our Reuse guide. 
You can also request a file or request permission for a file already on the internet."""

print(generate_summary(text))