
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'
const EMBED_BATCH_SIZE = 128 // chunks per request: keeps bodies small and lets us log progress

const explainFetchError = (err) => {
    const reason = (err.cause && (err.cause.code || err.cause.message)) || err.message
    return new Error(
        `Cannot reach the AI service at ${AI_SERVICE_URL} (${reason}). ` +
        `Is the Python service running and showing "Application startup complete"?`
    )
}

const embedBatch = async (texts) => {
    let response
    try {
        response = await fetch(`${AI_SERVICE_URL}/embed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts })
        })
    } catch (err) {
        throw explainFetchError(err)
    }

    if (!response.ok) {
        throw new Error(`AI service /embed failed (${response.status}): ${await response.text()}`)
    }

    const data = await response.json()
    return data.embeddings
}

/** Embed any number of chunks. Returns one vector per chunk, in order. */
const embedTexts = async (texts) => {
    if (!texts || texts.length === 0) return []

    const vectors = []
    const started = Date.now()

    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBED_BATCH_SIZE)
        vectors.push(...(await embedBatch(batch)))
        console.log(`Embedded ${Math.min(i + EMBED_BATCH_SIZE, texts.length)}/${texts.length} chunks`)
    }

    console.log(`Embedding took ${((Date.now() - started) / 1000).toFixed(1)}s for ${texts.length} chunks`)
    return vectors
}

module.exports = { embedTexts }