import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
    getProjectByIdAPI,
    uploadProjectZipAPI,
    getProjectFilesAPI,
    getFileByIdAPI,
    deleteFileAPI,
    searchProjectAPI,
    reindexProjectAPI,
    getIndexStatusAPI
} from '../service/allAPI'
import AskChat from '../components/AskChat'

function ProjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [project, setProject] = useState(null)
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [uploadStatus, setUploadStatus] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState(null)
    const [searching, setSearching] = useState(false)
    const [reindexing, setReindexing] = useState(false)
    const [indexStatus, setIndexStatus] = useState(null)
    const [highlight, setHighlight] = useState(null)
    const highlightRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        loadProject()
        loadFiles()
    }, [id])

    useEffect(() => {
        if (highlight && highlightRef.current) {
            highlightRef.current.scrollIntoView({ block: "center" })
        }
    }, [selectedFile, highlight])

    const fetchIndexStatus = async () => {
        try {
            const res = await getIndexStatusAPI(id)
            if (res.status === 200) {
                setIndexStatus((prev) => {
                    // don't resurrect a status card the user dismissed
                    if (!prev && res.data.state !== "indexing") return prev
                    return res.data
                })
            }
        }
        catch (err) {
            console.log(err.message)
        }
    }

    useEffect(() => {
        fetchIndexStatus()
    }, [id])

    useEffect(() => {
        if (indexStatus?.state !== "indexing") return
        const timer = setInterval(fetchIndexStatus, 2000)
        return () => clearInterval(timer)
    }, [indexStatus?.state, id])

    const loadProject = async () => {
        try {
            const res = await getProjectByIdAPI(id)
            if (res.status === 200) {
                setProject(res.data.project)
            } else {
                alert(res.data?.message || "Could not load project")
                navigate("/")
            }
        }
        catch (err) {
            console.log(err.message)
        }
    }

    const loadFiles = async () => {
        setLoading(true)
        try {
            const res = await getProjectFilesAPI(id)
            if (res.status === 200) {
                setFiles(res.data.files)
            }
        }
        catch (err) {
            console.log(err.message)
        }
        finally {
            setLoading(false)
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelected = async (e) => {
        const zip = e.target.files[0]
        e.target.value = ""
        if (!zip) return

        if (!zip.name.toLowerCase().endsWith('.zip')) {
            return alert("Please select a .zip file")
        }

        const formData = new FormData()
        formData.append('zipfile', zip)

        setUploading(true)
        setUploadStatus(null)
        try {
            const res = await uploadProjectZipAPI(id, formData)
            if (res.status === 201) {
                setUploadStatus({
                    ok: true,
                    filesStored: res.data.filesStored,
                    filesSkipped: res.data.filesSkipped,
                    summary: res.data.summary
                })
                setIndexStatus({ state: "indexing", done: 0, total: 0 })
                loadFiles()
            } else {
                setUploadStatus({ ok: false, message: res.data?.message || "Upload failed" })
            }
        }
        catch (err) {
            console.log(err.message)
            setUploadStatus({ ok: false, message: "Something went wrong during upload." })
        }
        finally {
            setUploading(false)
        }
    }

    const handleReindex = async () => {
        setReindexing(true)
        setUploadStatus(null)
        try {
            const res = await reindexProjectAPI(id)
            if (res.status === 202) {
                setUploadStatus({ ok: true, kind: "reindex", filesStored: res.data.filesIndexed })
                setIndexStatus({ state: "indexing", done: 0, total: 0 })
            } else {
                setUploadStatus({ ok: false, message: res.data?.message || "Could not rebuild the index" })
            }
        }
        catch (err) {
            console.log(err.message)
            setUploadStatus({ ok: false, message: "Something went wrong while rebuilding the index." })
        }
        finally {
            setReindexing(false)
        }
    }

    const handleViewFile = async (fileId, startLine, endLine) => {
        try {
            const res = await getFileByIdAPI(id, fileId)
            if (res.status === 200) {
                setHighlight(startLine ? { start: startLine, end: endLine || startLine } : null)
                setSelectedFile(res.data.file)
            } else {
                alert(res.data?.message || "Could not load file")
            }
        }
        catch (err) {
            console.log(err.message)
        }
    }

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm("Delete this file?")) return
        try {
            const res = await deleteFileAPI(id, fileId)
            if (res.status === 200) {
                setFiles(files.filter((f) => f._id !== fileId))
                if (selectedFile?._id === fileId) setSelectedFile(null)
            } else {
                alert(res.data?.message || "Could not delete file")
            }
        }
        catch (err) {
            console.log(err.message)
        }
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setSearching(true)
        try {
            const res = await searchProjectAPI(id, { query: searchQuery, topK: 5 })
            if (res.status === 200) {
                setSearchResults(res.data.results)
            } else {
                alert(res.data?.message || "Search failed")
            }
        }
        catch (err) {
            console.log(err.message)
        }
        finally {
            setSearching(false)
        }
    }

    const openSource = (source) => {
        handleViewFile(source.file_id, source.start_line, source.end_line)
    }

    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    // shared "glossy bento card" shell used by every panel on the page
    const cardClass =
        "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] " +
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-sm"

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            {/* ambient glow, like the reference background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
            </div>

            {/* Top bar */}
            <div className="relative border-b border-white/10 bg-neutral-950/80 backdrop-blur">
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <Link
                        to="/dash"
                        className="text-sm text-neutral-400 hover:text-teal-300 transition-colors"
                    >
                        ← Back to projects
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                {project?.name}
                            </h2>
                            {project?.description && (
                                <p className="mt-1 text-sm text-neutral-400">{project.description}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleReindex}
                                disabled={reindexing || uploading || indexStatus?.state === "indexing" || files.length === 0}
                                title="Re-chunk and re-embed the stored files without re-uploading"
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium
                                           text-neutral-200 hover:bg-white/10 disabled:cursor-not-allowed
                                           disabled:opacity-40 transition-colors"
                            >
                                {reindexing ? "Rebuilding…" : "Rebuild index"}
                            </button>
                            <button
                                type="button"
                                onClick={handleUploadClick}
                                disabled={uploading}
                                className="rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-neutral-950
                                           shadow-[0_0_24px_-4px_rgba(45,212,191,0.6)] hover:bg-teal-300
                                           disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                            >
                                {uploading ? "Uploading…" : "Upload .zip"}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleFileSelected}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mx-auto max-w-6xl px-6 py-6">
                {/* Upload status banner */}
                {uploadStatus && (
                    <div
                        className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm ${
                            uploadStatus.ok
                                ? "border-teal-400/20 bg-teal-400/[0.07] text-teal-100"
                                : "border-red-400/20 bg-red-400/[0.07] text-red-100"
                        }`}
                    >
                        <div>
                            {uploadStatus.ok ? (
                                <>
                                    <p>
                                        {uploadStatus.kind === "reindex" ? (
                                            <>Re-indexed <span className="font-semibold text-white">{uploadStatus.filesStored}</span> file(s).</>
                                        ) : (
                                            <>Stored <span className="font-semibold text-white">{uploadStatus.filesStored}</span> file(s),
                                            skipped {uploadStatus.filesSkipped}.</>
                                        )}
                                        {uploadStatus.chunksStored > 0 && (
                                            <> Generated <span className="font-semibold text-white">{uploadStatus.chunksStored}</span> embedded chunk(s).</>
                                        )}
                                    </p>
                                    {uploadStatus.summary && (
                                        <details className="mt-2 text-xs text-neutral-300">
                                            <summary className="cursor-pointer text-teal-300 underline decoration-teal-300/40">
                                                What was stored and skipped?
                                            </summary>
                                            <div className="mt-2 space-y-2">
                                                <div>
                                                    <p className="font-medium text-neutral-200">Stored, by folder</p>
                                                    {Object.entries(uploadStatus.summary.storedByFolder).map(([folder, n]) => (
                                                        <p key={folder} className="font-mono">{folder}: {n}</p>
                                                    ))}
                                                </div>
                                                {Object.keys(uploadStatus.summary.ignoredFolders).length > 0 && (
                                                    <div>
                                                        <p className="font-medium text-neutral-200">Skipped, inside ignored folders</p>
                                                        {Object.entries(uploadStatus.summary.ignoredFolders).map(([folder, n]) => (
                                                            <p key={folder} className="font-mono">{folder}: {n}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                {Object.keys(uploadStatus.summary.unsupportedTypes).length > 0 && (
                                                    <div>
                                                        <p className="font-medium text-neutral-200">Skipped, unsupported file types</p>
                                                        {Object.entries(uploadStatus.summary.unsupportedTypes).map(([ext, n]) => (
                                                            <p key={ext} className="font-mono">.{ext.replace(/^\./, "")}: {n}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                {uploadStatus.summary.generatedFiles > 0 && (
                                                    <p>Lock / minified / map files skipped: {uploadStatus.summary.generatedFiles}</p>
                                                )}
                                            </div>
                                        </details>
                                    )}
                                    {uploadStatus.embeddingError && (
                                        <p className="mt-1 font-medium text-amber-300">
                                            ⚠ {uploadStatus.embeddingError}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>{uploadStatus.message}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setUploadStatus(null)}
                            className="shrink-0 rounded-full border border-current px-2 py-1 text-xs hover:opacity-70"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Background indexing progress */}
                {indexStatus && indexStatus.state !== "idle" && (
                    <div
                        className={`mb-6 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm ${
                            indexStatus.state === "error"
                                ? "border-red-400/20 bg-red-400/[0.07] text-red-100"
                                : indexStatus.state === "done"
                                ? "border-teal-400/20 bg-teal-400/[0.07] text-teal-100"
                                : "border-white/10 bg-white/[0.04] text-neutral-200"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                {indexStatus.state === "indexing" && (
                                    <>
                                        <p>
                                            Indexing for search…{" "}
                                            <span className="font-semibold text-white">
                                                {indexStatus.total > 0
                                                    ? `${indexStatus.done} / ${indexStatus.total} chunks`
                                                    : "preparing"}
                                            </span>
                                        </p>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.7)] transition-all duration-500"
                                                style={{
                                                    width: `${indexStatus.total > 0 ? Math.round((indexStatus.done / indexStatus.total) * 100) : 3}%`
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-neutral-400">
                                            Your files are already saved. You can browse them while this runs;
                                            Search and Ask get better as more chunks are indexed.
                                        </p>
                                    </>
                                )}
                                {indexStatus.state === "done" && (
                                    <p>Indexed {indexStatus.chunksStored} chunks. Search and Ask are ready.</p>
                                )}
                                {indexStatus.state === "error" && (
                                    <>
                                        <p className="font-semibold text-white">Indexing stopped.</p>
                                        <p className="mt-1">{indexStatus.error}</p>
                                        <p className="mt-1 text-xs">
                                            Fix the cause, then click Rebuild index. Your files are safe.
                                        </p>
                                    </>
                                )}
                            </div>
                            {indexStatus.state !== "indexing" && (
                                <button
                                    type="button"
                                    onClick={() => setIndexStatus(null)}
                                    className="shrink-0 rounded-full border border-current px-2 py-1 text-xs hover:opacity-70"
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Ask the codebase: chat with history + streaming */}
                <AskChat projectId={id} onOpenSource={openSource} cardClass={cardClass} />

                {/* Semantic search */}
                <div className={`mb-6 p-6 ${cardClass}`}>
                    <h3 className="mb-3 text-lg font-bold text-white">Search this project</h3>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by meaning, e.g. &quot;how does login work?&quot;"
                            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-100
                                       placeholder:text-neutral-500 focus:border-teal-400/50 focus:outline-none
                                       focus:ring-1 focus:ring-teal-400/50"
                        />
                        <button
                            type="submit"
                            disabled={searching}
                            className="rounded-full bg-teal-400 px-5 py-2.5 text-sm font-semibold text-neutral-950
                                       shadow-[0_0_24px_-4px_rgba(45,212,191,0.6)] hover:bg-teal-300
                                       disabled:opacity-60 transition-colors"
                        >
                            {searching ? "Searching…" : "Search"}
                        </button>
                    </form>

                    {searchResults && (
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    {searchResults.length} result(s)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSearchResults(null)}
                                    className="text-xs text-neutral-500 hover:text-neutral-200"
                                >
                                    Clear
                                </button>
                            </div>

                            {searchResults.length === 0 ? (
                                <p className="text-sm text-neutral-500">
                                    No matches. Has this project been uploaded since indexing was added?
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {searchResults.map((r) => (
                                        <li key={r.chunk_id}>
                                            <button
                                                type="button"
                                                onClick={() => handleViewFile(r.file_id, r.start_line, r.end_line)}
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left
                                                           hover:border-teal-400/30 hover:bg-teal-400/[0.06] transition-colors"
                                            >
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className="truncate font-mono text-xs text-neutral-300">
                                                        {r.path && <span className="text-neutral-500">{r.path}/</span>}
                                                        {r.filename}
                                                    </span>
                                                    <span className="shrink-0 rounded-full bg-teal-400/15 px-2 py-0.5 font-mono text-[10px] font-medium text-teal-300">
                                                        {(r.score * 100).toFixed(0)}% match
                                                    </span>
                                                </div>
                                                <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-neutral-400">
                                                    {r.text}
                                                </pre>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* File browser: bento-style sidebar + preview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
                    {/* File list */}
                    <div className={`overflow-hidden ${cardClass}`}>
                        <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            Files
                        </div>

                        {loading ? (
                            <p className="px-4 py-6 text-sm text-neutral-500">Loading files…</p>
                        ) : files.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-neutral-500">
                                No files yet. Upload a .zip to get started.
                            </p>
                        ) : (
                            <ul className="max-h-[70vh] overflow-y-auto">
                                {files.map((file) => {
                                    const active = selectedFile?._id === file._id
                                    return (
                                        <li
                                            key={file._id}
                                            className={`group flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2 last:border-b-0 ${
                                                active ? "bg-teal-400/10" : "hover:bg-white/5"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleViewFile(file._id)}
                                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            >
                                                <span
                                                    className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase ${
                                                        file.type === "code"
                                                            ? "bg-teal-400/15 text-teal-300"
                                                            : "bg-amber-400/15 text-amber-300"
                                                    }`}
                                                >
                                                    {file.extension}
                                                </span>
                                                <span className="truncate font-mono text-sm text-neutral-300">
                                                    {file.path && (
                                                        <span className="text-neutral-500">{file.path}/</span>
                                                    )}
                                                    {file.filename}
                                                </span>
                                            </button>

                                            <span className="shrink-0 text-xs text-neutral-500">
                                                {formatBytes(file.size)}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFile(file._id)}
                                                className="shrink-0 text-neutral-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                                                aria-label="Delete file"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Preview pane */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm">
                        {selectedFile ? (
                            <>
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                    <span className="truncate font-mono text-sm text-neutral-300">
                                        {selectedFile.path && `${selectedFile.path}/`}
                                        {selectedFile.filename}
                                    </span>
                                    {selectedFile.truncated && (
                                        <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                                            truncated
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[70vh] overflow-auto py-3 font-mono text-xs leading-relaxed text-neutral-300">
                                    {selectedFile.content.split("\n").map((line, i) => {
                                        const n = i + 1
                                        const inRange = highlight && n >= highlight.start && n <= highlight.end
                                        return (
                                            <div
                                                key={n}
                                                ref={highlight && n === highlight.start ? highlightRef : null}
                                                className={`flex ${inRange ? "bg-teal-400/10" : ""}`}
                                            >
                                                <span className="w-12 shrink-0 select-none pr-3 text-right text-neutral-600">
                                                    {n}
                                                </span>
                                                <span className="whitespace-pre pr-4">{line}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full min-h-[300px] items-center justify-center px-4 text-sm text-neutral-500">
                                Select a file to preview its contents
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectDetail