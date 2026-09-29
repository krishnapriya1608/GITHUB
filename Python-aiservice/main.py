from dotenv import load_dotenv

load_dotenv()  # reads Python-aiservice/.env (ANTHROPIC_API_KEY, ANSWER_MODEL)

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List

from file_processor import process_file
from embeddings import embed_texts, get_model
import vectorstore
import rag
from typing import List, Optional
from fastapi.responses import StreamingResponse
import json
@asynccontextmanager
async def lifespan(app):
    # Load the embedding model once at startup so the first search isn't slow
    print("Loading embedding model...")
    get_model()
    print("Embedding model ready.")
    yield


app = FastAPI(lifespan=lifespan)


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
    start_line: int = 1
    end_line: int = 1


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


# ---------------- RAG: ASK A QUESTION ----------------
class AskRequest(BaseModel):
    project_id: str
    question: str
    top_k: int = 6


@app.post("/ask")
async def ask(payload: AskRequest):
    """Retrieve the most relevant chunks, then have Claude answer with citations."""
    results = vectorstore.search(payload.project_id, payload.question, payload.top_k)

    try:
        answer = rag.answer_question(payload.question, results)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Answer generation failed: {e}")

    # numbered to match the [1], [2] markers the model was told to cite
    sources = [{"number": i, **r} for i, r in enumerate(results, start=1)]

    return {"answer": answer, "sources": sources}


# ---------------- RAG: CHAT WITH HISTORY + STREAMING (SSE) ----------------
class ChatTurn(BaseModel):
    role: str
    content: str


class AskStreamRequest(BaseModel):
    project_id: str
    question: str
    top_k: int = 6
    history: Optional[List[ChatTurn]] = None


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@app.post("/ask-stream")
def ask_stream(payload: AskStreamRequest):
    """
    Server-Sent Events. Events, in order:
      {"type":"sources","sources":[...]}   once, before any text
      {"type":"token","text":"..."}        many
      {"type":"done"}                      or {"type":"error","message":"..."}
    Plain `def` (not async) so FastAPI runs the blocking search/LLM calls in a threadpool.
    """
    history = rag.clean_history([t.model_dump() for t in (payload.history or [])])

    def event_stream():
        try:
            query = rag.retrieval_query(payload.question, history)
            results = vectorstore.search(payload.project_id, query, payload.top_k)
            sources = [{"number": i, **r} for i, r in enumerate(results, start=1)]
            yield _sse({"type": "sources", "sources": sources})

            for piece in rag.stream_answer(payload.question, results, history):
                yield _sse({"type": "token", "text": piece})
            yield _sse({"type": "done"})
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

# ---------------- DIAGNOSTICS ----------------
@app.get("/stats")
async def stats(project_id: str = None, depth: int = 3):
    """Open http://127.0.0.1:8000/stats?project_id=<id> to see what is indexed, by folder."""
    return vectorstore.stats(project_id, depth)