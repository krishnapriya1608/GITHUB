// Maps a lowercase file extension (without the dot) to its language and
// whether it's "code" or a "document". Only these extensions are accepted
// during zip upload - everything else in the archive is skipped.
const EXTENSION_MAP = {
    js: { language: "javascript", type: "code" },
    jsx: { language: "javascript (jsx)", type: "code" },
    ts: { language: "typescript", type: "code" },
    tsx: { language: "typescript (tsx)", type: "code" },
    py: { language: "python", type: "code" },
    java: { language: "java", type: "code" },
    md: { language: "markdown", type: "document" },
    json: { language: "json", type: "document" }
}

// Folders we never want to pull files out of, even if they contain
// matching extensions (dependency trees, build output, vcs internals).
const IGNORED_DIR_SEGMENTS = new Set([
    "node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv",
    "coverage", ".next", "out", "target", ".idea", ".vscode", "chroma_db"
])

// Generated files: huge, machine-written, and useless for answering questions.
// (package-lock.json alone can turn into ~100 chunks that all need embedding.)
const IGNORED_FILE_NAMES = new Set([
    "package-lock.json", "npm-shrinkwrap.json", "composer.lock"
])

const getExtension = (fileName) => {
    const parts = fileName.split(".")
    if (parts.length < 2) return null
    return parts[parts.length - 1].toLowerCase()
}

const isIgnoredPath = (entryName) => {
    return entryName.split("/").some((segment) => IGNORED_DIR_SEGMENTS.has(segment))
}

// Which ignored folder (if any) this path sits inside, e.g. "node_modules"
const findIgnoredSegment = (entryName) => {
    return entryName.split("/").find((segment) => IGNORED_DIR_SEGMENTS.has(segment)) || null
}

const classifyFile = (fileName) => {
    const lower = fileName.toLowerCase()
    if (IGNORED_FILE_NAMES.has(lower)) return null
    if (lower.endsWith(".min.js") || lower.endsWith(".min.css") || lower.endsWith(".map")) return null

    const extension = getExtension(fileName)
    if (!extension || !EXTENSION_MAP[extension]) return null
    return { extension, ...EXTENSION_MAP[extension] }
}

module.exports = { EXTENSION_MAP, classifyFile, isIgnoredPath, findIgnoredSegment, getExtension }