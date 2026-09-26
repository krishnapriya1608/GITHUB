const CHUNK_SIZE = 1000 // characters — matches Python-aiservice/file_processor.py

/**
 * Split a file's content into fixed-size character chunks.
 * Kept dumb and simple on purpose so behavior matches the Python service's
 * chunk_text() exactly; if you tune chunk size/overlap, update both.
 */
const chunkText = (text, chunkSize = CHUNK_SIZE) => {
    const chunks = []

    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize))
    }

    return chunks
}

module.exports = chunkText