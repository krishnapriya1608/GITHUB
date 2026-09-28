// Talks to Python-aiservice's ChromaDB endpoints (/index, /search, delete).
// Requires Node 18+ (global fetch).

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const INDEX_BATCH_SIZE = 200 // keep each request body a reasonable size

const post = async (path, body) => {
    const response = await fetch(`${AI_SERVICE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    if (!response.ok) {
        throw new Error(`AI service ${path} failed (${response.status}): ${await response.text()}`)
    }
    return response.json()
}

// chunks: [{ id, text, embedding, project_id, file_id, filename, path, chunk_index }]
const indexChunks = async (chunks) => {
    let indexed = 0
    for (let i = 0; i < chunks.length; i += INDEX_BATCH_SIZE) {
        const batch = chunks.slice(i, i + INDEX_BATCH_SIZE)
        const data = await post('/index', { chunks: batch })
        indexed += data.count
    }
    return indexed
}

const searchChunks = async (projectId, query, topK = 5) => {
    const data = await post('/search', { project_id: projectId, query, top_k: topK })
    return data.results
}

const deleteFileVectors = async (fileId) => {
    const response = await fetch(`${AI_SERVICE_URL}/files/${fileId}`, { method: 'DELETE' })
    if (!response.ok) {
        throw new Error(`AI service delete failed (${response.status})`)
    }
}

module.exports = { indexChunks, searchChunks, deleteFileVectors }