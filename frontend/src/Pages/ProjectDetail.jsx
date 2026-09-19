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
        e.target.value = "" // allow re-selecting the same file later
        if (!zip) return

        if (!zip.name.toLowerCase().endsWith('.zip')) {
            return alert("Please select a .zip file")
        }

        const formData = new FormData()
        formData.append('zipfile', zip)

        setUploading(true)
        try {
            const res = await uploadProjectZipAPI(id, formData)
            if (res.status === 201) {
                alert(`Stored ${res.data.filesStored} file(s), skipped ${res.data.filesSkipped}`)
                loadFiles()
            } else {
                alert(res.data?.message || "Upload failed")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong during upload.")
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
        <div className="dashboard">
            <Link to="/">&larr; Back to projects</Link>

            <header className="dashboard-header">
                <div>
                    <h2>{project?.name}</h2>
                    {project?.description && <p>{project.description}</p>}
                </div>
                <div>
                    <button type="button" onClick={handleUploadClick} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload .zip"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        onChange={handleFileSelected}
                        style={{ display: "none" }}
                    />
                </div>
            </header>

            <div className="file-browser">
                <div className="file-list">
                    {loading ? (
                        <p>Loading files...</p>
                    ) : files.length === 0 ? (
                        <p>No files yet. Upload a .zip to get started.</p>
                    ) : (
                        <ul>
                            {files.map((file) => (
                                <li
                                    key={file._id}
                                    className={selectedFile?._id === file._id ? "file-row active" : "file-row"}
                                >
                                    <button type="button" onClick={() => handleViewFile(file._id)}>
                                        <span className={`badge badge-${file.type}`}>{file.language}</span>
                                        {file.path && <span className="file-path">{file.path}/</span>}
                                        {file.filename}
                                        <span className="file-size">{formatBytes(file.size)}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() => handleDeleteFile(file._id)}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {selectedFile && (
                    <div className="file-preview">
                        <h4>
                            {selectedFile.path && `${selectedFile.path}/`}
                            {selectedFile.filename}
                            {selectedFile.truncated && " (truncated)"}
                        </h4>
                        <pre>{selectedFile.content}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProjectDetail