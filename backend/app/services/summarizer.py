from __future__ import annotations

from functools import lru_cache

from app.models.model_loader import summarizer as Summarizer


@lru_cache(maxsize=1)
def _get_summarizer() -> Summarizer:
    return Summarizer()


def summarize_text(text: str) -> str:
    cleaned = " ".join(text.split()).strip()
    if not cleaned:
        return ""

    try:
        return _get_summarizer().generate_summary(cleaned)
    except Exception:
        # Fallback if model can't load (first run, missing deps, etc.)
        return cleaned[:600] + ("…" if len(cleaned) > 600 else "")