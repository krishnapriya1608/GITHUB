from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List

from file_processor import process_file
from embeddings import embed_texts
import vectorstore

app = FastAPI()


@app.get("/")
def home():
    return {"message": "AI Service is running"}


@app.post("/process-files")
async def process_files(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")

    result = process_file(file.filename, text)

    if result is None:
        return {"message": "File ignored", "file_name": file.filename}

    chunk_vectors = embed_texts(result["chunks"])

    result["chunks_with_embeddings"] = [
        {"chunk_index": i, "text": chunk, "embedding": vector}
        for i, (chunk, vector) in enumerate(zip(result["chunks"], chunk_vectors))
    ]

    return {"message": "File processed successfully", "file": result}


# ---------------- EMBEDDINGS ----------------
class EmbedRequest(BaseModel):
    texts: List[str]


@app.post("/embed")
async def embed(payload: EmbedRequest):
    vectors = embed_texts(payload.texts)
    return {
        "message": "Embeddings generated successfully",
        "count": len(vectors),
        "embeddings": vectors,
    }


# ---------------- VECTOR DB (ChromaDB) ----------------
class ChunkIn(BaseModel):
    id: str
    text: str
    embedding: List[float]
    project_id: str
    file_id: str
    filename: str
    path: str = ""
    chunk_index: int


class IndexRequest(BaseModel):
    chunks: List[ChunkIn]


@app.post("/index")
async def index_chunks(payload: IndexRequest):
    """Store already-embedded chunks in ChromaDB (called by the Node backend after upload)."""
    stored = vectorstore.upsert_chunks([c.model_dump() for c in payload.chunks])
    return {"message": "Chunks indexed", "count": stored}


class SearchRequest(BaseModel):
    project_id: str
    query: str
    top_k: int = 5


@app.post("/search")
async def search(payload: SearchRequest):
    """Find the chunks in a project most similar in meaning to the query."""
    results = vectorstore.search(payload.project_id, payload.query, payload.top_k)
    return {"message": "Search complete", "count": len(results), "results": results}


@app.delete("/files/{file_id}")
async def delete_file_vectors(file_id: str):
    vectorstore.delete_file(file_id)
    return {"message": "File vectors deleted"}


@app.delete("/projects/{project_id}")
async def delete_project_vectors(project_id: str):
    vectorstore.delete_project(project_id)
    return {"message": "Project vectors deleted"}