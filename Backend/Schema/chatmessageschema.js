const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: { type: Array, default: [] } // only set on assistant messages
}, { timestamps: true })

chatMessageSchema.index({ project: 1, createdAt: 1 })

module.exports = mongoose.model('ChatMessage', chatMessageSchema)