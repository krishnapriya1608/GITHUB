from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List

from file_processor import process_file
from embeddings import embed_texts

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Service is running"
    }


@app.post("/process-files")
async def process_files(file: UploadFile = File(...)):

    content = await file.read()

    text = content.decode(
        "utf-8",
        errors="ignore"
    )

    result = process_file(
        file.filename,
        text
    )

    if result is None:
        return {
            "message": "File ignored",
            "file_name": file.filename
        }

    # NEW: turn each chunk into a vector so it's ready for the vector DB (step 6)
    chunk_vectors = embed_texts(result["chunks"])

    result["chunks_with_embeddings"] = [
        {
            "chunk_index": i,
            "text": chunk,
            "embedding": vector
        }
        for i, (chunk, vector) in enumerate(zip(result["chunks"], chunk_vectors))
    ]

    return {
        "message": "File processed successfully",
        "file": result
    }


class EmbedRequest(BaseModel):
    texts: List[str]


@app.post("/embed")
async def embed(payload: EmbedRequest):
    """
    Standalone embedding endpoint.

    Use this from the Node backend for content that's already chunked
    elsewhere (e.g. files extracted from a project zip) — send the list
    of chunk strings here and get back one vector per chunk, same order.
    """
    vectors = embed_texts(payload.texts)

    return {
        "message": "Embeddings generated successfully",
        "count": len(vectors),
        "embeddings": vectors
    }