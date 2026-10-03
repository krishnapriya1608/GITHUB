const AdmZip = require('adm-zip')
const Project = require('../Schema/projectSchema')
const File = require('../Schema/fileSchema')
const Chunk = require('../Schema/chunkSchema')
const { classifyFile, findIgnoredSegment, getExtension, EXTENSION_MAP } = require('../utils/fileClassifier')
const { startIndexJob, getJob, isRunning } = require('../utils/indexJobs')
const ChatMessage = require('../Schema/chatmessageschema')
const { buildFileTree, detectEndpoints, detectSymbols } = require('../utils/codeAnalyzer')
const { searchChunks, askQuestion, askQuestionStream, deleteFileVectors, deleteProjectVectors, getArchitectureSummary } = require('../utils/vectorClient')
const MAX_ENTRIES = 2000            // guard against zip bombs — counts relevant files only, after filtering
const MAX_FILE_CONTENT_BYTES = 200 * 1024 // truncate any single file's stored content at 200KB
const { downloadRepoZip, ImportError } = require('../utils/githubImport')
// A project only belongs to the logged-in user if owner matches
const findOwnedProject = async (projectId, userId) => {
    return Project.findOne({ _id: projectId, owner: userId })
}

// ---------------- UPLOAD + EXTRACT ZIP ----------------

const extractZip = (buffer, projectId, { stripTopFolder = false, source = "" } = {}) => {
    let zip
    try {
        zip = new AdmZip(buffer)
    } catch {
        throw new ImportError(400, "Not a valid zip archive")      // CHANGED: throw instead of res.status
    }

    const filesToInsert = []
    let skippedCount = 0, relevantCount = 0, generatedFiles = 0
    const ignoredFolders = {}, unsupportedTypes = {}

    for (const entry of zip.getEntries()) {
        // ... your existing loop body, unchanged, EXCEPT these two places:

        // (a) the "too many files" check
        //     OLD: return res.status(400).json({ message: `Zip has too many...` })
        //     NEW:
        //     throw new ImportError(400, `Zip has too many relevant files (max ${MAX_ENTRIES})`)

        // (b) where you push into filesToInsert
        //     NEW: build a path that starts with the zip name, and store the source
        const fullPath = source
            ? (folderPath ? `${source}/${folderPath}` : source)
            : folderPath

        filesToInsert.push({
            project: projectId,
            filename,
            path: fullPath,          // CHANGED
            source,                  // NEW
            extension: classification.extension,
            language: classification.language,
            type: classification.type,
            size: Buffer.byteLength(content, 'utf-8'),
            truncated,
            content
        })
    }

    if (filesToInsert.length === 0) {
        throw new ImportError(400, "No supported code/document files found in this zip")
    }
    return { filesToInsert, skippedCount, generatedFiles, ignoredFolders, unsupportedTypes }
}
// removes all files (and their chunks/vectors) that came from one zip name
const removeSource = async (projectId, source) => {
    const old = await File.find({ project: projectId, source }).select('_id')
    if (!old.length) return
    const ids = old.map(f => f._id)
    await Chunk.deleteMany({ file: { $in: ids } })
    await Promise.all(ids.map(id => deleteFileVectors(id).catch(() => {})))
    await File.deleteMany({ _id: { $in: ids } })
}

const importZips = async (req, res, loadZips, { stripTopFolder = false } = {}) => {
    try {
        const { projectId } = req.params
        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) return res.status(404).json({ message: "Project not found" })

        if (isRunning(projectId)) {
            return res.status(409).json({ message: "Indexing is still running, try again shortly" })
        }

        let zips                                   // [{ buffer, name, source }]
        try {
            zips = await loadZips()
        } catch (err) {
            if (err.status) return res.status(err.status).json({ message: err.message })
            throw err
        }

        const allToInsert = []
        const results = []

        for (const { buffer, name, source } of zips) {
            try {
                const r = extractZip(buffer, project._id, { stripTopFolder, source })
                if (source) await removeSource(projectId, source)   // same zip name = replace old version
                allToInsert.push(...r.filesToInsert)
                results.push({
                    zip: name, ok: true,
                    filesStored: r.filesToInsert.length,
                    filesSkipped: r.skippedCount,
                    summary: {
                        ignoredFolders: r.ignoredFolders,
                        unsupportedTypes: r.unsupportedTypes,
                        generatedFiles: r.generatedFiles
                    }
                })
            } catch (err) {
                if (!err.status) throw err          // real bug -> goes to the outer catch
                results.push({ zip: name, ok: false, message: err.message })   // this zip failed, others continue
            }
        }

        if (allToInsert.length === 0) {
            return res.status(400).json({ message: "No files were stored", results })
        }

        const inserted = await File.insertMany(allToInsert)
        startIndexJob(project._id, inserted)       // ONE indexing job for everything

        res.status(201).json({
            message: "Zips processed",
            filesStored: inserted.length,
            filesSkipped: results.reduce((n, r) => n + (r.filesSkipped || 0), 0),
            summary: results.find(r => r.ok)?.summary,   // keeps the old GitHub banner working
            indexing: true,
            results
        })
    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- UPLOAD + EXTRACT ZIP ----------------
exports.uploadProjectZip = (req, res) => {
    console.log("Inside upload project zip")
    return importZips(req, res, async () => {
        if (!req.files?.length) throw new ImportError(400, "No zip files uploaded")
        return req.files.map(f => ({
            buffer: f.buffer,
            name: f.originalname,
            source: f.originalname.replace(/\.zip$/i, "")
        }))
    })
}

// ---------------- IMPORT FROM GITHUB URL ----------------
exports.importFromGithub = (req, res) => {
    console.log("Inside import from GitHub")
    return importZips(req, res, async () => {
        const buffer = await downloadRepoZip(req.body?.url)
        return [{ buffer, name: "github", source: "" }]
    }, { stripTopFolder: true })
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

// ---------------- DELETE ONE FILE (AND ITS CHUNKS/VECTORS) ----------------
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

        await Chunk.deleteMany({ file: fileId })

        try {
            await deleteFileVectors(fileId)
        }
        catch (err) {
            console.log("Could not delete vectors:", err.message)
        }

        res.status(200).json({ message: "File deleted successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- SEMANTIC SEARCH WITHIN A PROJECT ----------------
exports.searchProject = async (req, res) => {
    console.log("Inside search project")
    try {
        const { projectId } = req.params
        const { query, topK } = req.body

        if (!query || !query.trim()) {
            return res.status(400).json({ message: "Query is required" })
        }

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const limit = Math.min(Math.max(parseInt(topK) || 5, 1), 20)
        const results = await searchChunks(projectId, query.trim(), limit)

        res.status(200).json({ message: "Search complete", results })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Search failed: " + err.message })
    }
}

// ---------------- ASK A QUESTION (RAG ANSWER WITH CITATIONS) ----------------
exports.askProject = async (req, res) => {
    console.log("Inside ask project")
    try {
        const { projectId } = req.params
        const { question, topK } = req.body

        if (!question || !question.trim()) {
            return res.status(400).json({ message: "Question is required" })
        }
        if (question.length > 2000) {
            return res.status(400).json({ message: "Question is too long (max 2000 characters)" })
        }

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const limit = Math.min(Math.max(parseInt(topK) || 8, 1), 12)
        const data = await askQuestion(projectId, question.trim(), limit)

        res.status(200).json({ message: "Answer generated", answer: data.answer, sources: data.sources })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Could not generate answer: " + err.message })
    }
}// ---------------- CHAT: HISTORY + STREAMING (SSE) ----------------
// Body: { question, topK?, history?: [{ role: 'user'|'assistant', content }] }
// The browser keeps the conversation and sends it back each turn, so the server stays stateless.
exports.askProjectStream = async (req, res) => {
    console.log("Inside ask project (stream)")
    const controller = new AbortController()
    // stop the Python/LLM work if the user closes the tab or presses Stop
    res.on('close', () => { if (!res.writableEnded) controller.abort() })

    try {
        const { projectId } = req.params
        const { question, topK, history } = req.body

        if (!question || !question.trim()) {
            return res.status(400).json({ message: "Question is required" })
        }
        if (question.length > 2000) {
            return res.status(400).json({ message: "Question is too long (max 2000 characters)" })
        }

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        await ChatMessage.create({ project: projectId, role: 'user', content: question.trim() })

        // never trust client history: valid roles only, capped size and length
        const safeHistory = (Array.isArray(history) ? history : [])
            .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))

        const limit = Math.min(Math.max(parseInt(topK) || 8, 1), 12)
        const upstream = await askQuestionStream(projectId, question.trim(), limit, safeHistory, controller.signal)

        if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text()
            return res.status(502).json({ message: `AI service error (${upstream.status}): ${detail.slice(0, 300)}` })
        }

        res.status(200).set({
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        })
        res.flushHeaders()

        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''
        let answerText = ''
        let sources = []

        const captureFrame = (frame) => {
            const line = frame.split('\n').find((l) => l.startsWith('data:'))
            if (!line) return
            let event
            try { event = JSON.parse(line.slice(5).trim()) } catch { return }
            if (event.type === 'sources') sources = event.sources
            else if (event.type === 'token') answerText += event.text
        }

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value) // unchanged: forward raw bytes to the browser immediately

            sseBuffer += decoder.decode(value, { stream: true })
            let idx
            while ((idx = sseBuffer.indexOf('\n\n')) !== -1) {
                captureFrame(sseBuffer.slice(0, idx))
                sseBuffer = sseBuffer.slice(idx + 2)
            }
        }
        res.end()

        if (answerText.trim()) {
            await ChatMessage.create({ project: projectId, role: 'assistant', content: answerText, sources })
        }
    }
    catch (err) {
        if (err.name === 'AbortError') return // client left; nothing to send
        console.log(err.message)
        if (!res.headersSent) {
            return res.status(500).json({ message: "Could not generate answer: " + err.message })
        }
        // stream already started: report the failure in-band so the UI can show it
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
        res.end()
    }
}

// ---------------- REBUILD THE INDEX FOR A PROJECT ----------------
// Re-chunks and re-embeds the files already stored, without re-uploading the zip.
// Use it after an embedding failure or after changing chunk settings.
exports.reindexProject = async (req, res) => {
    console.log("Inside reindex project")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const files = await File.find({ project: projectId })
        if (files.length === 0) {
            return res.status(400).json({ message: "This project has no files to index" })
        }

        if (isRunning(projectId)) {
            return res.status(409).json({ message: "Indexing is already in progress for this project" })
        }

        await Chunk.deleteMany({ project: projectId })
        try {
            await deleteProjectVectors(projectId)
        } catch (err) {
            console.log("Could not clear old vectors:", err.message)
        }

        startIndexJob(project._id, files)

        res.status(202).json({
            message: "Rebuilding index in the background",
            filesIndexed: files.length,
            indexing: true
        })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- INDEXING PROGRESS ----------------
exports.getIndexStatus = async (req, res) => {
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        res.status(200).json(getJob(projectId))
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- CHAT HISTORY (persisted) ----------------
exports.getChatHistory = async (req, res) => {
    console.log("Inside get chat history")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const messages = await ChatMessage.find({ project: projectId }).sort({ createdAt: 1 })
        res.status(200).json({ message: "History fetched", messages })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

exports.clearChatHistory = async (req, res) => {
    console.log("Inside clear chat history")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        await ChatMessage.deleteMany({ project: projectId })
        res.status(200).json({ message: "History cleared" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}


// ---------------- PROJECT ANALYSIS (deterministic, no LLM) ----------------
// Folder tree, detected API endpoints, and detected functions/classes, built
// straight from the files already stored - always accurate, instant, and free.
exports.getProjectAnalysis = async (req, res) => {
    console.log("Inside get project analysis")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const files = await File.find({ project: projectId })
        if (files.length === 0) {
            return res.status(400).json({ message: "This project has no files yet" })
        }

        const tree = buildFileTree(files)
        const endpoints = detectEndpoints(files)
        const symbols = detectSymbols(files)

        res.status(200).json({
            message: "Analysis complete",
            fileCount: files.length,
            tree,
            endpoints,
            symbols
        })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- PROJECT ANALYSIS SUMMARY (LLM-written, optional) ----------------
// A short prose overview on top of the deterministic analysis above. Separate
// endpoint so the fast, reliable analysis never depends on the AI service.
exports.getProjectSummary = async (req, res) => {
    console.log("Inside get project summary")
    try {
        const { projectId } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const files = await File.find({ project: projectId })
        if (files.length === 0) {
            return res.status(400).json({ message: "This project has no files yet" })
        }

        const tree = buildFileTree(files)
        const endpoints = detectEndpoints(files)
        const symbols = detectSymbols(files)

        const summary = await getArchitectureSummary({ projectName: project.name, tree, endpoints, symbols })
        res.status(200).json({ message: "Summary generated", summary })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Could not generate summary: " + err.message })
    }
}

// ---------------- DELETE ALL FILES FROM ONE ZIP ----------------
exports.deleteSource = async (req, res) => {
    console.log("Inside delete source")
    try {
        const { projectId, source } = req.params

        const project = await findOwnedProject(projectId, req.user.id)
        if (!project) return res.status(404).json({ message: "Project not found" })

        if (isRunning(projectId)) {
            return res.status(409).json({ message: "Indexing is in progress, try again shortly" })
        }

        const count = await File.countDocuments({ project: projectId, source })
        if (count === 0) return res.status(404).json({ message: "No files found for this zip" })

        await removeSource(projectId, source)

        res.status(200).json({ message: "Zip removed successfully", removed: count })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}