const AdmZip = require('adm-zip')
const Project = require('../Schema/projectSchema')
const File = require('../Schema/fileSchema')
const { classifyFile, isIgnoredPath } = require('../utils/fileClassifier')

const MAX_ENTRIES = 1000            // guard against zip bombs
const MAX_FILE_CONTENT_BYTES = 200 * 1024 // truncate any single file's stored content at 200KB

// A project only belongs to the logged-in user if owner matches
const findOwnedProject = async (projectId, userId) => {
    return Project.findOne({ _id: projectId, owner: userId })
}

// ---------------- UPLOAD + EXTRACT ZIP ----------------
exports.uploadProjectZip = async (req, res) => {
    console.log("Inside upload project zip")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "No zip file uploaded" })
        }

        let zip
        try {
            zip = new AdmZip(req.file.buffer)
        } catch (err) {
            return res.status(400).json({ message: "Uploaded file is not a valid zip archive" })
        }

        const entries = zip.getEntries()
        if (entries.length > MAX_ENTRIES) {
            return res.status(400).json({ message: `Zip has too many entries (max ${MAX_ENTRIES})` })
        }

        const filesToInsert = []
        let skippedCount = 0

        for (const entry of entries) {
            if (entry.isDirectory) continue

            const entryName = entry.entryName // e.g. "src/components/App.jsx"

            // guard against zip-slip style paths, just in case
            if (entryName.includes('..')) {
                skippedCount++
                continue
            }
            if (isIgnoredPath(entryName)) {
                skippedCount++
                continue
            }

            const filename = entryName.split('/').pop()
            const folderPath = entryName.includes('/')
                ? entryName.slice(0, entryName.lastIndexOf('/'))
                : ""

            const classification = classifyFile(filename)
            if (!classification) {
                skippedCount++
                continue
            }

            const rawBuffer = entry.getData()
            let content = rawBuffer.toString('utf-8')
            let truncated = false

            if (Buffer.byteLength(content, 'utf-8') > MAX_FILE_CONTENT_BYTES) {
                content = content.slice(0, MAX_FILE_CONTENT_BYTES)
                truncated = true
            }

            filesToInsert.push({
                project: project._id,
                filename,
                path: folderPath,
                extension: classification.extension,
                language: classification.language,
                type: classification.type,
                size: Buffer.byteLength(content, 'utf-8'),
                truncated,
                content
            })
        }

        if (filesToInsert.length === 0) {
            return res.status(400).json({
                message: "No supported code/document files found in this zip (.js, .jsx, .ts, .tsx, .py, .java, .md, .json)"
            })
        }

        const inserted = await File.insertMany(filesToInsert)

        res.status(201).json({
            message: "Zip processed successfully",
            filesStored: inserted.length,
            filesSkipped: skippedCount,
            files: inserted.map((f) => ({
                _id: f._id,
                filename: f.filename,
                path: f.path,
                extension: f.extension,
                language: f.language,
                type: f.type,
                size: f.size,
                truncated: f.truncated
            }))
        })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- LIST FILES FOR A PROJECT ----------------
exports.getProjectFiles = async (req, res) => {
    console.log("Inside get project files")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        // exclude the (potentially large) content field from the list view
        const files = await File.find({ project: projectId })
            .select('-content')
            .sort({ path: 1, filename: 1 })

        res.status(200).json({ message: "Files fetched successfully", files })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- GET ONE FILE (WITH CONTENT) ----------------
exports.getFileById = async (req, res) => {
    console.log("Inside get file by id")
    try {
        const { projectId, fileId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const file = await File.findOne({ _id: fileId, project: projectId })
        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }

        res.status(200).json({ message: "File fetched successfully", file })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- DELETE ONE FILE ----------------
exports.deleteFile = async (req, res) => {
    console.log("Inside delete file")
    try {
        const { projectId, fileId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const file = await File.findOneAndDelete({ _id: fileId, project: projectId })
        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }

        res.status(200).json({ message: "File deleted successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}