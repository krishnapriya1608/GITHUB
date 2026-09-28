// Talks to Python-aiservice's ChromaDB endpoints (/index, /search, /ask, delete).
// Requires Node 18+ (global fetch).

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'
const INDEX_BATCH_SIZE = 200 // keep each request body a reasonable size

const explainFetchError = (err) => {
    const reason = (err.cause && (err.cause.code || err.cause.message)) || err.message
    return new Error(
        `Cannot reach the AI service at ${AI_SERVICE_URL} (${reason}). ` +
        `Is the Python service running and showing "Application startup complete"?`
    )
}

const call = async (method, path, body) => {
    let response
    try {
        response = await fetch(`${AI_SERVICE_URL}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        })
    } catch (err) {
        throw explainFetchError(err)
    }

    if (!response.ok) {
        throw new Error(`AI service ${path} failed (${response.status}): ${await response.text()}`)
    }
    return response.json()
}

// chunks: [{ id, text, embedding, project_id, file_id, filename, path, chunk_index, start_line, end_line }]
const indexChunks = async (chunks) => {
    let indexed = 0
    for (let i = 0; i < chunks.length; i += INDEX_BATCH_SIZE) {
        const data = await call('POST', '/index', { chunks: chunks.slice(i, i + INDEX_BATCH_SIZE) })
        indexed += data.count
    }
    return indexed
}

const searchChunks = async (projectId, query, topK = 5) => {
    const data = await call('POST', '/search', { project_id: projectId, query, top_k: topK })
    return data.results
}

// Retrieval + LLM answer with citations, all done inside the Python service
const askQuestion = async (projectId, question, topK = 6) => {
    return call('POST', '/ask', { project_id: projectId, question, top_k: topK })
}

const deleteFileVectors = async (fileId) => call('DELETE', `/files/${fileId}`)
const deleteProjectVectors = async (projectId) => call('DELETE', `/projects/${projectId}`)

module.exports = { indexChunks, searchChunks, askQuestion, deleteFileVectors, deleteProjectVectors }