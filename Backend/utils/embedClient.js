// Talks to Python-aiservice's /embed endpoint.
// Requires Node 18+ (global fetch) — no extra dependency needed.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

/**
 * Send a batch of text chunks to the Python AI service and get back
 * one embedding vector per chunk, in the same order.
 */
const embedTexts = async (texts) => {
    if (!texts || texts.length === 0) return []

    const response = await fetch(`${AI_SERVICE_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts })
    })

    if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`AI service /embed failed (${response.status}): ${errBody}`)
    }

    const data = await response.json()
    return data.embeddings
}

module.exports = { embedTexts }