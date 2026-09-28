// Turns stored File documents into searchable chunks:
//   chunk -> embed -> save in MongoDB -> index in ChromaDB
// Works in small batches so progress can be reported and a failure part-way
// through keeps what was already done. Never throws: returns { chunksStored, total, error }.

const Chunk = require('../Schema/chunkSchema')
const chunkCode = require('./chunkCode')
const { embedTexts } = require('./embedClient')
const { indexChunks } = require('./vectorClient')

const BATCH_SIZE = 128

const indexFiles = async (projectId, files, onProgress = () => {}) => {
    // 1. Plan every chunk up front (cheap, no network) so we know the total
    const planned = []
    const fileById = new Map()

    for (const file of files) {
        fileById.set(file._id.toString(), file)

        chunkCode(file.content).forEach((piece, index) => {
            planned.push({
                doc: {
                    project: projectId,
                    file: file._id,
                    chunkIndex: index,
                    startLine: piece.startLine,
                    endLine: piece.endLine,
                    text: piece.text
                },
                // the file's identity helps "login" match Login.jsx / loginController.js
                embedInput: `File: ${file.path ? file.path + '/' : ''}${file.filename}\n${piece.text}`
            })
        })
    }

    const total = planned.length
    let chunksStored = 0
    let error = null

    console.log(`Created ${total} chunks from ${files.length} files`)
    onProgress({ done: 0, total })

    // 2. Embed + save + index one batch at a time
    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = planned.slice(i, i + BATCH_SIZE)

        try {
            const vectors = await embedTexts(batch.map((b) => b.embedInput))
            batch.forEach((b, k) => { b.doc.embedding = vectors[k] })

            const inserted = await Chunk.insertMany(batch.map((b) => b.doc))
            chunksStored += inserted.length

            try {
                await indexChunks(
                    inserted.map((c) => {
                        const file = fileById.get(c.file.toString())
                        return {
                            id: c._id.toString(),
                            text: c.text,
                            embedding: c.embedding,
                            project_id: projectId.toString(),
                            file_id: c.file.toString(),
                            filename: file.filename,
                            path: file.path || '',
                            chunk_index: c.chunkIndex,
                            start_line: c.startLine,
                            end_line: c.endLine
                        }
                    })
                )
            } catch (err) {
                error = `Chunks were saved, but vector indexing failed: ${err.message}`
                break
            }
        } catch (err) {
            error = `Embedding failed: ${err.message}`
            break
        }

        onProgress({ done: Math.min(i + BATCH_SIZE, total), total })
    }

    if (error) console.log('Indexing stopped:', error)
    return { chunksStored, total, error }
}

module.exports = indexFiles