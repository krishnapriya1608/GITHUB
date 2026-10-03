import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
    getProjectByIdAPI,
    uploadProjectZipAPI,
    importGithubAPI,
    getProjectFilesAPI,
    getFileByIdAPI,
    deleteFileAPI,
    searchProjectAPI,
    reindexProjectAPI,
    getIndexStatusAPI
} from '../service/allAPI'
import AskChat from '../components/AskChat'
import ArchitectureOverview from '../components/ArchitectureOverview'

/* ---------- shared style tokens (dark bento, matches reference) ---------- */
const CARD =
    "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0d0d0d] p-3"
const PANEL = "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0b0b0b]"
const CHIP =
    "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-neutral-300"
const TAG =
    "rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-neutral-200 shadow-lg"
const ARROW_BTN =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
const PILL_BTN =
    "rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
const PRIMARY_BTN =
    "rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"

function CardFooter({ title, text, children }) {
    return (
        <div className="flex items-end justify-between gap-4 px-3 pb-2 pt-4">
            <div>
                <h3 className="text-xs font-semibold text-white">{title}</h3>
                <p className="mt-2 max-w-[230px] text-[11px] leading-relaxed text-neutral-400">{text}</p>
            </div>
            {children || <span className={ARROW_BTN} aria-hidden="true">↗</span>}
        </div>
    )
}

function Node({ icon, title, sub, active, onClick, disabled, children }) {
    const Tag = onClick ? 'button' : 'div'
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            disabled={disabled}
            className={`block w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-left transition-colors ${active ? "border-amber-400/40" : "border-white/[0.08]"
                } ${onClick ? "hover:bg-white/[0.06] disabled:opacity-60" : ""}`}
        >
            <span className="flex items-center gap-4">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm text-neutral-200 ${active ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-white/[0.05]"
                        }`}
                >
                    {icon}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white">{title}</span>
                    {sub && <span className="mt-0.5 block truncate text-[11px] text-neutral-500">{sub}</span>}
                </span>
            </span>
            {children}
        </Tag>
    )
}

const Plus = () => (
    <div className="flex justify-center py-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] text-neutral-300">+</span>
    </div>
)

function ProjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [githubModalOpen, setGithubModalOpen] = useState(false)
    const [githubUrl, setGithubUrl] = useState("")
    const [importing, setImporting] = useState(false)

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
        const zips = Array.from(e.target.files)
        e.target.value = ""
        if (!zips.length) return
        if (zips.some(z => !z.name.toLowerCase().endsWith('.zip'))) {
            return alert("Please select only .zip files")
        }

        const formData = new FormData()
        zips.forEach(z => formData.append('zipfiles', z))   // field name must match the route

        setUploading(true); setUploadStatus(null)
        try {
            const res = await uploadProjectZipAPI(id, formData)
            if (res.status === 201) {
                setUploadStatus({ ok: true, filesStored: res.data.filesStored, results: res.data.results })
                setIndexStatus({ state: "indexing", done: 0, total: 0 })
                loadFiles()
            } else {
                setUploadStatus({ ok: false, message: res.data?.message || "Upload failed" })
            }
        } catch { setUploadStatus({ ok: false, message: "Something went wrong during upload." }) }
        finally { setUploading(false) }
    }

    const handleImportGithub = async (e) => {
        e.preventDefault()
        if (!githubUrl.trim()) return

        setImporting(true)
        setUploadStatus(null)
        try {
            const res = await importGithubAPI(id, githubUrl.trim())
            if (res.status === 201) {
                setUploadStatus({
                    ok: true,
                    filesStored: res.data.filesStored,
                    filesSkipped: res.data.filesSkipped,
                    summary: res.data.summary
                })
                setIndexStatus({ state: "indexing", done: 0, total: 0 })
                setGithubModalOpen(false)
                setGithubUrl("")
                loadFiles()
            } else {
                setUploadStatus({ ok: false, message: res.data?.message || "Import failed" })
            }
        }
        catch (err) {
            console.log(err.message)
            setUploadStatus({ ok: false, message: "Something went wrong while importing from GitHub." })
        }
        finally {
            setImporting(false)
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

    /* derived data for chart cards */
    const sorted = [...files].sort((a, b) => b.size - a.size)
    const largest = sorted[0]
    const smallest = sorted[sorted.length - 1]
    const totalSize = files.reduce((s, f) => s + (f.size || 0), 0)
    const barFiles = files.slice(0, 12)
    const maxSize = Math.max(1, ...barFiles.map((f) => f.size || 0))
    const maxIdx = barFiles.findIndex((f) => f.size === maxSize)

    const indexing = indexStatus?.state === "indexing"
    const indexPct =
        indexStatus?.total > 0 ? Math.round((indexStatus.done / indexStatus.total) * 100) : 3
    const indexSub = !indexStatus || indexStatus.state === "idle"
        ? "Ready when files are stored"
        : indexing
            ? indexStatus.total > 0
                ? `${indexStatus.done} / ${indexStatus.total} chunks`
                : "Preparing…"
            : indexStatus.state === "done"
                ? `${indexStatus.chunksStored} chunks indexed`
                : "Indexing stopped"

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-black text-white"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap');`}</style>

            {/* Giant faded background word */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none text-[clamp(110px,22vw,260px)] font-semibold leading-none tracking-tight text-white/[0.04]"
            >
                FEATURES
            </div>

            <input ref={fileInputRef} type="file" accept=".zip" multiple onChange={handleFileSelected} className="hidden" />

            <div className="relative mx-auto max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <Link
                            to="/dash"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                        >
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 text-[9px]">⌂</span>
                            Back to projects
                        </Link>
                        <h2 className="mt-5 text-3xl font-medium tracking-tight text-white">
                            {project?.name}
                        </h2>
                        {project?.description && (
                            <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-400">
                                {project.description}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleReindex}
                            disabled={reindexing || uploading || indexing || files.length === 0}
                            title="Re-chunk and re-embed the stored files without re-uploading"
                            className={PILL_BTN}
                        >
                            {reindexing ? "Rebuilding…" : "Rebuild index"}
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className={PRIMARY_BTN}
                        >
                            {uploading ? "Uploading…" : "Upload .zip"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setGithubModalOpen(true)}
                            className={PILL_BTN}
                        >
                            Import from GitHub
                        </button>
                    </div>
                </div>

                {/* Import from GitHub modal */}
                {githubModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                        onClick={() => !importing && setGithubModalOpen(false)}
                    >
                        <div
                            className={`${CARD} w-full max-w-md p-6`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-sm font-medium text-white">Import from GitHub</h3>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                                Paste a public repo URL. It's cloned, filtered, and indexed the same way a .zip upload is.
                            </p>
                            <form onSubmit={handleImportGithub} className="mt-4">
                                <input
                                    type="text"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/owner/repo"
                                    autoFocus
                                    disabled={importing}
                                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white
                                               placeholder-neutral-600 outline-none focus:border-white/25 disabled:opacity-50"
                                />
                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setGithubModalOpen(false)}
                                        disabled={importing}
                                        className={`${PILL_BTN} disabled:opacity-50`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={importing || !githubUrl.trim()}
                                        className={`${PRIMARY_BTN} disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                        {importing ? "Importing…" : "Import"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Upload status banner */}
                {uploadStatus && (
                    <div
                        className={`mt-8 flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 text-sm ${uploadStatus.ok
                            ? "border-white/[0.07] bg-[#101010] text-neutral-200"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                            }`}
                    >
                        <div>
                            {uploadStatus.ok ? (
                                <>
                                    <p>
                                        {uploadStatus.kind === "reindex" ? (
                                            <>Re-indexed <span className="font-medium text-white">{uploadStatus.filesStored}</span> file(s).</>
                                        ) : (
                                            <>Stored <span className="font-medium text-white">{uploadStatus.filesStored}</span> file(s),
                                                skipped {uploadStatus.filesSkipped}.</>
                                        )}
                                        {uploadStatus.chunksStored > 0 && (
                                            <> Generated <span className="font-medium text-white">{uploadStatus.chunksStored}</span> embedded chunk(s).</>
                                        )}
                                    </p>
                                    {uploadStatus.summary && (
                                        <details className="mt-2 text-xs text-neutral-400">
                                            <summary className="cursor-pointer text-amber-300 underline decoration-amber-300/40">
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
                                        <p className="mt-1 font-medium text-amber-400">
                                            ⚠ {uploadStatus.embeddingError}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>{uploadStatus.message}</p>
                            )}
                        </div>
                        <button type="button" onClick={() => setUploadStatus(null)} className={`${PILL_BTN} shrink-0 !px-3 !py-1`}>
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Background indexing progress */}
                {indexStatus && indexStatus.state !== "idle" && (
                    <div
                        className={`mt-4 rounded-2xl border px-5 py-4 text-sm ${indexStatus.state === "error"
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : "border-white/[0.07] bg-[#101010] text-neutral-200"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                {indexing && (
                                    <>
                                        <p>
                                            Indexing for search…{" "}
                                            <span className="font-medium text-white">
                                                {indexStatus.total > 0
                                                    ? `${indexStatus.done} / ${indexStatus.total} chunks`
                                                    : "preparing"}
                                            </span>
                                        </p>
                                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-300 transition-all duration-500"
                                                style={{ width: `${indexPct}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-neutral-500">
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
                                        <p className="font-medium text-white">Indexing stopped.</p>
                                        <p className="mt-1">{indexStatus.error}</p>
                                        <p className="mt-1 text-xs">
                                            Fix the cause, then click Rebuild index. Your files are safe.
                                        </p>
                                    </>
                                )}
                            </div>
                            {!indexing && (
                                <button type="button" onClick={() => setIndexStatus(null)} className={`${PILL_BTN} shrink-0 !px-3 !py-1`}>
                                    Dismiss
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Bento grid */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* 1. Files (wave chart card) */}
                    <div className={`${CARD} md:row-span-2`}>
                        <div className={`${PANEL} h-full min-h-[420px]`}>
                            <div className="flex items-center justify-between px-4 pt-4">
                                <span className={CHIP}>Files: {files.length}</span>
                                <span className={CHIP}>{formatBytes(totalSize)}</span>
                            </div>

                            <div className="relative mt-2 h-28">
                                <svg viewBox="0 0 300 110" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                                    <defs>
                                        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#d9a066" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#d9a066" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0 95 C40 90 60 60 110 62 S170 30 230 28 S280 25 300 22 L300 110 L0 110 Z" fill="url(#waveFill)" />
                                    <path d="M0 95 C40 90 60 60 110 62 S170 30 230 28 S280 25 300 22" fill="none" stroke="#d9a066" strokeWidth="1" strokeOpacity="0.8" />
                                    <path d="M0 100 C50 98 80 80 130 84 S200 70 300 60" fill="none" stroke="#fff" strokeOpacity="0.15" />
                                    <circle cx="150" cy="48" r="3.5" fill="#fff" />
                                    <circle cx="230" cy="76" r="3.5" fill="#fff" />
                                </svg>
                                <span className={`${TAG} absolute left-[22%] top-2 max-w-[45%] truncate`}>
                                    {largest ? `Largest: ${largest.filename}` : "Largest"}
                                </span>
                                <span className={`${TAG} absolute bottom-1 right-3 max-w-[45%] truncate`}>
                                    {smallest ? `Smallest: ${smallest.filename}` : "Smallest"}
                                </span>
                            </div>

                            {loading ? (
                                <p className="px-4 py-6 text-sm text-neutral-500">Loading files…</p>
                            ) : files.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-neutral-500">
                                    No files yet. Upload a .zip to get started.
                                </p>
                            ) : (
                                <ul className="mt-2 max-h-[240px] space-y-2 overflow-y-auto px-3 pb-3">
                                    {files.map((file) => {
                                        const active = selectedFile?._id === file._id
                                        return (
                                            <li
                                                key={file._id}
                                                className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors ${active
                                                    ? "border-amber-400/40 bg-white/[0.06]"
                                                    : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewFile(file._id)}
                                                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                                >
                                                    <span
                                                        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase ${file.type === "code"
                                                            ? "border-white/15 bg-white/[0.06] text-neutral-200"
                                                            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                                            }`}
                                                    >
                                                        {file.extension}
                                                    </span>
                                                    <span className="truncate text-xs text-neutral-200">
                                                        {file.path && <span className="text-neutral-500">{file.path}/</span>}
                                                        {file.filename}
                                                    </span>
                                                </button>
                                                <span className="shrink-0 text-[10px] text-neutral-500">{formatBytes(file.size)}</span>
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
                        <CardFooter
                            title=""
                        // text="Browse every stored file and open any of them in the preview below."
                        />
                    </div>

                    {/* 2. Upload + index workflow card */}
                    <div className={`${CARD} md:row-span-2`}>
                        <div className={`${PANEL} flex h-full min-h-[420px] flex-col justify-center px-5 py-6`}>
                            <Node
                                icon="⚙"
                                title={uploading ? "Uploading…" : "Upload .zip"}
                                sub="Choose a zip from your computer"
                                onClick={handleUploadClick}
                                disabled={uploading}
                            />
                            <Plus />
                            <Node
                                icon=">_"
                                title="Store files"
                                active={!!uploadStatus?.ok}
                                sub={
                                    uploadStatus?.ok
                                        ? `${uploadStatus.filesStored} stored${uploadStatus.filesSkipped != null ? `, ${uploadStatus.filesSkipped} skipped` : ""}`
                                        : `${files.length} file(s) stored`
                                }
                            />
                            <Plus />
                            <Node
                                icon="✉"
                                title="Index for search"
                                active={indexing || indexStatus?.state === "done"}
                                sub={indexSub}
                            >
                                {indexing && (
                                    <span className="mt-3 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                                        <span
                                            className="block h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-300 transition-all duration-500"
                                            style={{ width: `${indexPct}%` }}
                                        />
                                    </span>
                                )}
                            </Node>
                        </div>
                        <CardFooter
                        // text="Upload a zip, store the files, then index them for search and Ask."
                        >
                            <button
                                type="button"
                                onClick={handleReindex}
                                disabled={reindexing || uploading || indexing || files.length === 0}
                                aria-label="Rebuild index"
                                title="Rebuild index"
                                className={ARROW_BTN}
                            >
                                ↻
                            </button>
                        </CardFooter>
                    </div>

                    {/* 3a. About card (chip graphic) */}
                    <div className={CARD}>
                        <div className={`${PANEL} flex h-44 items-center justify-center`}>
                            <svg viewBox="0 0 300 150" className="absolute inset-0 h-full w-full" fill="none">
                                <path d="M0 40 H70 L95 60 H115" stroke="#fff" strokeOpacity="0.12" />
                                <path d="M0 110 H60 L90 90 H115" stroke="#fff" strokeOpacity="0.12" />
                                <path d="M300 40 H230 L205 60 H185" stroke="#fff" strokeOpacity="0.12" />
                                <path d="M300 110 H240 L210 90 H185" stroke="#fff" strokeOpacity="0.12" />
                            </svg>
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/15 bg-[#131313]">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-[#1a1a1a]">
                                    <div className="h-6 w-6 rounded-md border border-white/30" />
                                </div>
                                {["left-1 top-1", "right-1 top-1", "left-1 bottom-1", "right-1 bottom-1"].map((pos) => (
                                    <span key={pos} className={`absolute ${pos} h-1 w-1 rounded-full bg-white/40`} />
                                ))}
                            </div>
                        </div>
                        <CardFooter
                            title="About Project"
                            text={project?.description || "Store, embed and search the files that belong to this project."}
                        />
                    </div>

                    {/* 3b. File size bars */}
                    <div className={CARD}>
                        <div className={`${PANEL} flex h-44 flex-col justify-between px-4 pb-0 pt-4`}>
                            <div className="flex items-start justify-between">
                                <span className={CHIP}>Total {formatBytes(totalSize)}</span>
                                {barFiles.length > 0 && (
                                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] text-amber-300">
                                        {formatBytes(maxSize)}
                                    </span>
                                )}
                            </div>
                            <div className="flex h-24 items-end gap-2">
                                {barFiles.length === 0 ? (
                                    <p className="pb-4 text-[11px] text-neutral-500">Upload files to see their sizes.</p>
                                ) : (
                                    barFiles.map((f, i) => (
                                        <div
                                            key={f._id}
                                            title={`${f.filename} · ${formatBytes(f.size)}`}
                                            style={{ height: `${Math.max(12, (f.size / maxSize) * 100)}%` }}
                                            className={`flex-1 rounded-t-md ${i === maxIdx
                                                ? "bg-gradient-to-t from-white/10 to-amber-300/50"
                                                : "bg-gradient-to-t from-white/[0.03] to-white/[0.12]"
                                                }`}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                        <CardFooter
                            title="File Sizes"
                            text="See at a glance which files take up the most space."
                        />
                    </div>
                </div>

                {/* Ask the codebase: chat with history + streaming */}
                <div className="mt-4">
                    <AskChat projectId={id} onOpenSource={openSource} cardClass={CARD} />
                </div>

                {/* Deterministic project analysis + optional LLM summary */}
                <div className="mt-4">
                    <ArchitectureOverview projectId={id} cardClass={CARD} />
                </div>

                {/* Semantic search */}
                <div className={`${CARD} mt-4`}>
                    <div className={`${PANEL} p-5`}>
                        <span className={CHIP}>Search</span>
                        <h3 className="mt-3 text-lg font-medium text-white">Search this project</h3>
                        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder='Search by meaning, e.g. "how does login work?"'
                                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-100
                                           placeholder:text-neutral-500 focus:border-amber-400/40 focus:outline-none
                                           focus:ring-1 focus:ring-amber-400/30"
                            />
                            <button type="submit" disabled={searching} className={PRIMARY_BTN}>
                                {searching ? "Searching…" : "Search"}
                            </button>
                        </form>

                        {searchResults && (
                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-neutral-500">{searchResults.length} result(s)</span>
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
                                                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left
                                                               transition-colors hover:border-amber-400/30 hover:bg-white/[0.05]"
                                                >
                                                    <div className="mb-1 flex items-center justify-between gap-2">
                                                        <span className="truncate font-mono text-xs text-neutral-300">
                                                            {r.path && <span className="text-neutral-500">{r.path}/</span>}
                                                            {r.filename}
                                                        </span>
                                                        <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
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
                    <CardFooter
                        title="Semantic Search"
                        text="Find code by meaning. Click a result to jump to its lines."
                    />
                </div>

                {/* Preview with line numbers + highlighted range */}
                <div className={`${CARD} mt-4`}>
                    <div className={`${PANEL} flex min-h-[320px] flex-col`}>
                        {selectedFile ? (
                            <>
                                <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                                    <span className={`${CHIP} max-w-full truncate`}>
                                        {selectedFile.path && `${selectedFile.path}/`}
                                        {selectedFile.filename}
                                    </span>
                                    {selectedFile.truncated && (
                                        <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-300">
                                            truncated
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[70vh] flex-1 overflow-auto py-3 font-mono text-xs leading-relaxed text-neutral-300">
                                    {selectedFile.content.split("\n").map((line, i) => {
                                        const n = i + 1
                                        const inRange = highlight && n >= highlight.start && n <= highlight.end
                                        return (
                                            <div
                                                key={n}
                                                ref={highlight && n === highlight.start ? highlightRef : null}
                                                className={`flex ${inRange ? "bg-amber-400/10" : ""}`}
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
                            <div className="relative flex flex-1 items-center justify-center px-4">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-amber-500/[0.07] to-transparent"
                                />
                                <span className={`${TAG} relative`}>Select a file to preview its contents</span>
                            </div>
                        )}
                    </div>
                    <CardFooter
                        title="File Preview"
                        text="Read any stored file here with its full path and content."
                    />
                </div>
            </div>
        </div>
    )
}

export default ProjectDetail