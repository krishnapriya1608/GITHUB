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

// Streams /ask/stream from the AI service and returns the raw Response so the
// controller can pipe its body straight through (Server-Sent Events pass-through).
// It does NOT throw on a non-OK status: the controller checks upstream.ok and reports it.
// `signal` lets the controller cancel the request (Stop button / closed tab).
const askQuestionStream = async (projectId, question, topK = 8, history = [], signal) => {
    try {
        return await fetch(`${AI_SERVICE_URL}/ask-stream`, {   // was /ask/stream
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                question,
                top_k: topK,
                history
            }),
            signal
        })
    } catch (err) {
        if (err.name === 'AbortError') throw err
        throw explainFetchError(err)
    }
}

// Sends the deterministic analysis (tree/endpoints/symbols) to the AI service
// and gets back a short prose summary. No conversation, no retrieval - this
// is a one-shot structured-input -> structured-output call.
const getArchitectureSummary = async ({ projectName, tree, endpoints, symbols }) => {
    let response
    try {
        response = await fetch(`${AI_SERVICE_URL}/architecture-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_name: projectName, tree, endpoints, symbols })
        })
    } catch (err) {
        throw explainFetchError(err)
    }
    if (!response.ok) {
        throw new Error(`AI service /architecture-summary failed (${response.status}): ${await response.text()}`)
    }
    const data = await response.json()
    return data.summary
}

module.exports = {
    indexChunks,
    searchChunks,
    askQuestion,
    askQuestionStream,
    streamAsk: askQuestionStream, // old name kept as an alias
    deleteFileVectors,
    deleteProjectVectors,
    getArchitectureSummary
}