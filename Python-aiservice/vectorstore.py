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


def search(project_id: str, query: str, top_k: int = 5, max_per_file: int = 2) -> List[Dict[str, Any]]:
    """
    Embed the query and return the top_k most similar chunks in this project.

    At most `max_per_file` chunks come from any single file, so one file with many
    similar chunks can't fill every slot and hide the rest of the codebase
    (e.g. a frontend page crowding out the backend controller).
    """
    query_vector = embed_single(query)

    result = _collection.query(
        query_embeddings=[query_vector],
        n_results=min(top_k * 5, 50),  # fetch extra candidates, then diversify
        where={"project_id": project_id},
    )

    ids = result["ids"][0]
    docs = result["documents"][0]
    metas = result["metadatas"][0]
    distances = result["distances"][0]

    ranked = [
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

    picked, per_file = [], {}
    for r in ranked:
        if per_file.get(r["file_id"], 0) >= max_per_file:
            continue
        per_file[r["file_id"]] = per_file.get(r["file_id"], 0) + 1
        picked.append(r)
        if len(picked) == top_k:
            return picked

    # not enough distinct files: fill the remaining slots with the best leftovers
    for r in ranked:
        if len(picked) == top_k:
            break
        if r not in picked:
            picked.append(r)

    return sorted(picked, key=lambda r: -r["score"])


def delete_file(file_id: str) -> None:
    _collection.delete(where={"file_id": file_id})


def delete_project(project_id: str) -> None:
    _collection.delete(where={"project_id": project_id})


def stats(project_id: str = None, depth: int = 3) -> Dict[str, Any]:
    """
    How many vectors are stored, overall and (optionally) for one project, with a
    per-folder breakdown so you can see WHICH parts of the codebase are indexed.
    `depth` = how many path segments make up a folder label.
    """
    out = {"total_vectors": _collection.count()}

    if project_id:
        found = _collection.get(where={"project_id": project_id}, include=["metadatas"])
        metas = found["metadatas"]

        files, folders = set(), {}
        for m in metas:
            path = m.get("path", "")
            files.add(f"{path}/{m['filename']}" if path else m["filename"])
            label = "/".join(path.split("/")[:depth]) if path else "(root)"
            folders[label] = folders.get(label, 0) + 1

        out["project_id"] = project_id
        out["project_vectors"] = len(metas)
        out["files_indexed"] = len(files)
        out["chunks_by_folder"] = dict(sorted(folders.items(), key=lambda kv: -kv[1]))

    return out