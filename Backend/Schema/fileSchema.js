const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        // folder path inside the zip, e.g. "src/components"
        type: String,
        default: ""
    },
    extension: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    type: {
        // "code" or "document"
        type: String,
        enum: ["code", "document"],
        required: true
    },
    size: {
        // bytes, of the stored (possibly truncated) content
        type: Number,
        default: 0
    },
    truncated: {
        type: Boolean,
        default: false
    },
    content: {
        type: String,
        default: ""
    }
}, { timestamps: true })

fileSchema.index({ project: 1, path: 1, filename: 1 })

const File = mongoose.model('File', fileSchema)
module.exports = File