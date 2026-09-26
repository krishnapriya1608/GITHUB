import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
    getProjectByIdAPI,
    uploadProjectZipAPI,
    getProjectFilesAPI,
    getFileByIdAPI,
    deleteFileAPI
} from '../service/allAPI'

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

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        loadProject()
        loadFiles()
    }, [id])

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
                    chunksStored: res.data.chunksStored,
                    embeddingError: res.data.embeddingError
                })
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

    const handleViewFile = async (fileId) => {
        try {
            const res = await getFileByIdAPI(id, fileId)
            if (res.status === 200) {
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

    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Top bar */}
            <div className="border-b border-neutral-200 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-5">
                    <Link
                        to="/"
                        className="text-sm text-neutral-500 hover:text-teal-700 transition-colors"
                    >
                        ← Back to projects
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-900">
                                {project?.name}
                            </h2>
                            {project?.description && (
                                <p className="mt-1 text-sm text-neutral-500">{project.description}</p>
                            )}
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleUploadClick}
                                disabled={uploading}
                                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white
                                           hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60
                                           transition-colors"
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

            <div className="mx-auto max-w-6xl px-6 py-6">
                {/* Upload status banner */}
                {uploadStatus && (
                    <div
                        className={`mb-6 flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${
                            uploadStatus.ok
                                ? "border-teal-200 bg-teal-50 text-teal-900"
                                : "border-red-200 bg-red-50 text-red-900"
                        }`}
                    >
                        <div>
                            {uploadStatus.ok ? (
                                <>
                                    <p>
                                        Stored <span className="font-medium">{uploadStatus.filesStored}</span> file(s),
                                        skipped {uploadStatus.filesSkipped}.
                                        {uploadStatus.chunksStored > 0 && (
                                            <> Generated <span className="font-medium">{uploadStatus.chunksStored}</span> embedded chunk(s).</>
                                        )}
                                    </p>
                                    {uploadStatus.embeddingError && (
                                        <p className="mt-1 font-medium text-amber-700">
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
                            className="shrink-0 rounded border border-current px-2 py-1 text-xs hover:opacity-70"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* File browser: explorer-style sidebar + editor-style preview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
                    {/* File list */}
                    <div className="rounded-lg border border-neutral-200 bg-white">
                        <div className="border-b border-neutral-200 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Files
                        </div>

                        {loading ? (
                            <p className="px-4 py-6 text-sm text-neutral-400">Loading files…</p>
                        ) : files.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-neutral-400">
                                No files yet. Upload a .zip to get started.
                            </p>
                        ) : (
                            <ul className="max-h-[70vh] overflow-y-auto">
                                {files.map((file) => {
                                    const active = selectedFile?._id === file._id
                                    return (
                                        <li
                                            key={file._id}
                                            className={`group flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2 last:border-b-0 ${
                                                active ? "bg-teal-50" : "hover:bg-neutral-50"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleViewFile(file._id)}
                                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                            >
                                                <span
                                                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase ${
                                                        file.type === "code"
                                                            ? "bg-teal-100 text-teal-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {file.extension}
                                                </span>
                                                <span className="truncate font-mono text-sm text-neutral-700">
                                                    {file.path && (
                                                        <span className="text-neutral-400">{file.path}/</span>
                                                    )}
                                                    {file.filename}
                                                </span>
                                            </button>

                                            <span className="shrink-0 text-xs text-neutral-400">
                                                {formatBytes(file.size)}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFile(file._id)}
                                                className="shrink-0 text-neutral-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
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
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
                        {selectedFile ? (
                            <>
                                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5">
                                    <span className="truncate font-mono text-sm text-neutral-300">
                                        {selectedFile.path && `${selectedFile.path}/`}
                                        {selectedFile.filename}
                                    </span>
                                    {selectedFile.truncated && (
                                        <span className="shrink-0 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                                            truncated
                                        </span>
                                    )}
                                </div>
                                <pre className="max-h-[70vh] overflow-auto px-4 py-4 font-mono text-xs leading-relaxed text-neutral-200">
                                    {selectedFile.content}
                                </pre>
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
