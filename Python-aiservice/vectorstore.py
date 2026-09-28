"""
vectorstore.py
--------------
ChromaDB wrapper. Stores one vector per code chunk and answers
"which chunks are most similar to this question?" for a given project.

MongoDB stays the source of truth for file/chunk text; Chroma holds the
vectors + a copy of the text and metadata so search results are self-contained.
"""

import chromadb
from typing import List, Dict, Any

from embeddings import embed_single

_client = chromadb.PersistentClient(path="./chroma_db")  # saved on disk, survives restarts

_collection = _client.get_or_create_collection(
    name="code_chunks",
    metadata={"hnsw:space": "cosine"},  # embeddings are normalized -> cosine similarity
)

BATCH_SIZE = 500


def upsert_chunks(chunks: List[Dict[str, Any]]) -> int:
    """
    chunks: list of dicts with keys
        id, text, embedding, project_id, file_id, filename, path, chunk_index
    Upsert = re-uploading the same chunk id overwrites instead of duplicating.
    """
    total = 0
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        _collection.upsert(
            ids=[c["id"] for c in batch],
            embeddings=[c["embedding"] for c in batch],
            documents=[c["text"] for c in batch],
            metadatas=[
                {
                    "project_id": c["project_id"],
                    "file_id": c["file_id"],
                    "filename": c["filename"],
                    "path": c.get("path", ""),
                    "chunk_index": c["chunk_index"],
                    "start_line": c.get("start_line", 1),
                    "end_line": c.get("end_line", 1),
                }
                for c in batch
            ],
        )
        total += len(batch)
    return total


def search(project_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Embed the query, return the top_k most similar chunks in this project."""
    query_vector = embed_single(query)

    result = _collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where={"project_id": project_id},
    )

    ids = result["ids"][0]
    docs = result["documents"][0]
    metas = result["metadatas"][0]
    distances = result["distances"][0]

    return [
        {
            "chunk_id": ids[i],
            "text": docs[i],
            "file_id": metas[i]["file_id"],
            "filename": metas[i]["filename"],
            "path": metas[i]["path"],
            "chunk_index": metas[i]["chunk_index"],
            "start_line": metas[i].get("start_line", 1),
            "end_line": metas[i].get("end_line", 1),
            "score": round(1 - distances[i], 4),  # cosine distance -> similarity (higher = closer)
        }
        for i in range(len(ids))
    ]


def delete_file(file_id: str) -> None:
    _collection.delete(where={"file_id": file_id})


def delete_project(project_id: str) -> None:
    _collection.delete(where={"project_id": project_id})


def stats(project_id: str = None) -> Dict[str, Any]:
    """How many vectors are stored, overall and (optionally) for one project."""
    out = {"total_vectors": _collection.count()}
    if project_id:
        found = _collection.get(where={"project_id": project_id}, include=[])
        out["project_id"] = project_id
        out["project_vectors"] = len(found["ids"])
    return out