const mongoose = require('mongoose')

const chunkSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    chunkIndex: { type: Number, required: true },
    startLine: { type: Number, default: 1 },   // 1-based, inclusive
    endLine: { type: Number, default: 1 },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }   // 384-dim vector
}, { timestamps: true })

chunkSchema.index({ file: 1, chunkIndex: 1 })
chunkSchema.index({ project: 1 })

module.exports = mongoose.model('Chunk', chunkSchema)