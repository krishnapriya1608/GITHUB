"""
embeddings.py
--------------
Generates vector embeddings for text chunks using a local
sentence-transformers model (no API key, runs on CPU).

Model: all-MiniLM-L6-v2
  - 384-dimensional vectors
  - Fast, small (~80MB), good default for RAG / code+docs retrieval
  - Same dimension works cleanly with ChromaDB's default collection config,
    so step 6 (vector DB) can consume this output directly.
"""

from sentence_transformers import SentenceTransformer
from typing import List

_model = None  # lazy-loaded singleton so the model loads once per process


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        # Default is 256 tokens, which silently cuts off most of a code chunk.
        # The model supports up to 512, so let it read the whole chunk.
        _model.max_seq_length = 512
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a batch of text chunks.
    Returns a list of embedding vectors (list[float]), one per input text,
    in the same order as the input.
    """
    if not texts:
        return []

    model = get_model()
    vectors = model.encode(
        texts,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,  # cosine similarity ready
    )
    return vectors.tolist()


def embed_single(text: str) -> List[float]:
    """Embed one piece of text (e.g. a user's chat question at retrieval time)."""
    return embed_texts([text])[0]