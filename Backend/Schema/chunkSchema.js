const mongoose = require('mongoose')

const chunkSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    chunkIndex: {
        // position of this chunk within its file, starting at 0
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        // 384-dim vector from the Python service (all-MiniLM-L6-v2)
        type: [Number],
        required: true
    }
}, { timestamps: true })

chunkSchema.index({ file: 1, chunkIndex: 1 })
chunkSchema.index({ project: 1 })

const Chunk = mongoose.model('Chunk', chunkSchema)
module.exports = Chunk