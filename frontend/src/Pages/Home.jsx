import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMyProjectsAPI, createProjectAPI, deleteProjectAPI } from '../service/allAPI'

// Change this if your project detail route is different (e.g. `/project/${id}`)
const projectRoute = (id) => `/projects/${id}`

const CARD = "rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0d0d0d] p-3"
const PANEL = "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0b0b0b]"
const CHIP = "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-neutral-300"
const ARROW = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-200 transition-colors hover:bg-white/10"
const PILL = "rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:opacity-40"
const PRIMARY = "rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/20 disabled:opacity-50"
const INPUT = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-400/40 focus:outline-none focus:ring-1 focus:ring-amber-400/30"

// What the app can do, shown to the user as the "feature map"
const FEATURES = [
    { icon: "⇪", title: "Upload a project", text: "Drop in a .zip. Code and docs are stored; node_modules, lock files and binaries are skipped.", chips: [".zip", "auto-filter"] },
    { icon: "▤", title: "Browse and preview", text: "Open any stored file with line numbers, its full path and its size.", chips: ["line numbers", "file tree"] },
    { icon: "⌕", title: "Semantic search", text: "Search by meaning, like \"how does login work?\", and jump to the exact lines.", chips: ["by meaning", "jump to line"] },
    { icon: "✦", title: "Ask the codebase", text: "Chat with your code. Answers stream in with clickable source citations.", chips: ["streaming", "citations", "history"] },
    { icon: "◫", title: "Architecture overview", text: "See the folder tree, detected API endpoints and functions, plus an AI summary.", chips: ["endpoints", "symbols"] },
    { icon: "↻", title: "Rebuild the index", text: "Re-chunk and re-embed stored files any time without uploading again.", chips: ["no re-upload", "progress bar"] },
]

function Dashboard() {
    const navigate = useNavigate()

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login")
            return
        }
        loadProjects()
    }, [])

    const loadProjects = async () => {
        setLoading(true)
        try {
            const res = await getMyProjectsAPI()
            if (res.status === 200) setProjects(res.data.projects || [])
        } catch (err) {
            console.log(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!name.trim()) return setError("Project name is required")
        setCreating(true)
        setError("")
        try {
            const res = await createProjectAPI({ name: name.trim(), description: description.trim() })
            if (res.status === 201 || res.status === 200) {
                const created = res.data.project
                setName("")
                setDescription("")
                setShowForm(false)
                if (created?._id) navigate(projectRoute(created._id))
                else loadProjects()
            } else {
                setError(res.data?.message || "Could not create project")
            }
        } catch (err) {
            console.log(err.message)
            setError("Something went wrong while creating the project.")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this project and all its files?")) return
        try {
            const res = await deleteProjectAPI(id)
            if (res.status === 200) setProjects((prev) => prev.filter((p) => p._id !== id))
            else alert(res.data?.message || "Could not delete project")
        } catch (err) {
            console.log(err.message)
        }
    }

    const logout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "")

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-black text-white"
            style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap');`}</style>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none text-[clamp(110px,22vw,260px)] font-semibold leading-none tracking-tight text-white/[0.04]"
            >
                FEATURES
            </div>

            <div className="relative mx-auto max-w-6xl px-6 py-10">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <span className={`${CHIP} gap-2 !px-4 !py-2 !text-xs !text-neutral-200`}>
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 text-[9px]">⌂</span>
                            Dashboard
                        </span>
                        <h1 className="mt-5 text-3xl font-medium tracking-tight">Understand any codebase</h1>
                    </div>
                    <div className="flex items-end gap-4">
                        <p className="hidden max-w-xs text-xs leading-relaxed text-neutral-400 md:block">
                            Upload a project, then search it, read it and ask it questions. Everything you can do is below.
                        </p>
                        <button type="button" onClick={logout} className={PILL}>Log out</button>
                    </div>
                </div>

                {/* Feature map */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f) => (
                        <div key={f.title} className={CARD}>
                            <div className={`${PANEL} flex h-36 flex-col justify-between p-4`}>
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-lg text-amber-300">
                                    {f.icon}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {f.chips.map((c) => (
                                        <span key={c} className={CHIP}>{c}</span>
                                    ))}
                                </div>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-amber-500/[0.06] to-transparent"
                                />
                            </div>
                            <div className="flex items-end justify-between gap-4 px-3 pb-2 pt-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-white">{f.title}</h3>
                                    <p className="mt-2 max-w-[250px] text-[11px] leading-relaxed text-neutral-400">{f.text}</p>
                                </div>
                                <span className={ARROW} aria-hidden="true">↗</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Projects */}
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-medium">Your projects</h2>
                        <p className="mt-1 text-xs text-neutral-500">{projects.length} project(s)</p>
                    </div>
                    <button type="button" onClick={() => setShowForm((s) => !s)} className={PRIMARY}>
                        {showForm ? "Cancel" : "+ New project"}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreate} className={`${CARD} mt-4`}>
                        <div className={`${PANEL} space-y-3 p-5`}>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Project name"
                                className={INPUT}
                                autoFocus
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description (optional)"
                                rows={2}
                                className={INPUT}
                            />
                            {error && <p className="text-xs text-red-300">{error}</p>}
                            <button type="submit" disabled={creating} className={PRIMARY}>
                                {creating ? "Creating…" : "Create project"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p className="text-sm text-neutral-500">Loading projects…</p>
                    ) : projects.length === 0 ? (
                        <div className={`${CARD} sm:col-span-2 lg:col-span-3`}>
                            <div className={`${PANEL} flex min-h-[160px] items-center justify-center px-4`}>
                                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-neutral-300">
                                    No projects yet. Create one to get started.
                                </span>
                            </div>
                        </div>
                    ) : (
                        projects.map((p) => (
                            <div key={p._id} className={`${CARD} group`}>
                                <Link to={projectRoute(p._id)} className={`${PANEL} block min-h-[120px] p-4 transition-colors hover:border-amber-400/30`}>
                                    <span className={CHIP}>{formatDate(p.createdAt) || "Project"}</span>
                                    <h3 className="mt-3 truncate text-base font-medium text-white">{p.name}</h3>
                                    <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
                                        {p.description || "No description"}
                                    </p>
                                </Link>
                                <div className="flex items-center justify-between gap-4 px-3 pb-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(p._id)}
                                        className="text-[11px] text-neutral-600 transition-colors hover:text-red-400"
                                    >
                                        Delete
                                    </button>
                                    <Link to={projectRoute(p._id)} className={ARROW} aria-label={`Open ${p.name}`}>↗</Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
