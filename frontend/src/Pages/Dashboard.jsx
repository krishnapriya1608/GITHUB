import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, FolderPlus, Folder, LogOut, ExternalLink, Loader2 } from 'lucide-react'
import { createProjectAPI, getMyProjectsAPI, deleteProjectAPI } from '../service/allAPI'

function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [form, setForm] = useState({ name: "", description: "" })
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (!token || !storedUser) {
            navigate("/login")
            return
        }
        setUser(JSON.parse(storedUser))
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const res = await getMyProjectsAPI()
            if (res.status === 200) {
                setProjects(res.data.projects || [])
            } else if (res.status === 401) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                navigate("/login")
            } else {
                alert(res.data?.message || "Could not load projects")
            }
        } catch (err) {
            console.error("Fetch projects error:", err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) {
            return alert("Project name is required")
        }
        
        setIsSubmitting(true)
        try {
            const res = await createProjectAPI(form)
            if (res.status === 201) {
                setProjects([res.data.project, ...projects])
                setForm({ name: "", description: "" })
            } else {
                alert(res.data?.message || "Could not create project")
            }
        } catch (err) {
            console.error("Create project error:", err.message)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return
        try {
            const res = await deleteProjectAPI(id)
            if (res.status === 200) {
                setProjects(projects.filter((p) => p._id !== id))
            } else {
                alert(res.data?.message || "Could not delete project")
            }
        } catch (err) {
            console.error("Delete project error:", err.message)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-[#0b0c0e] text-[#e1e4ea] antialiased selection:bg-orange-500/30 selection:text-orange-200">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0c0e]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Folder className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-white tracking-tight">Project Portal</h1>
                            <p className="text-[11px] text-zinc-400">Welcome back, {user?.name || 'User'}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Create Project Panel */}
                    <div className="lg:col-span-5 bg-[#121318] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-6">
                            <FolderPlus className="w-5 h-5 text-orange-400" />
                            <h2 className="text-base font-semibold text-white">New Project</h2>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                    Project Name <span className="text-orange-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Analytics Redesign"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c0e] border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Brief overview of project scope..."
                                    value={form.description}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c0e] border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-zinc-950 font-semibold text-xs tracking-wide transition-all duration-200 shadow-lg shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>Create Project</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Projects List */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <h2 className="text-base font-semibold text-white">Your Projects</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-[11px] font-medium text-zinc-400 border border-white/5">
                                {projects.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3 border border-white/5 rounded-2xl bg-[#121318]/50">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                                <span className="text-xs font-medium">Fetching projects...</span>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-16 px-4 border border-dashed border-white/10 rounded-2xl bg-[#121318]/30">
                                <Folder className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                                <h3 className="text-sm font-medium text-zinc-300">No projects found</h3>
                                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                                    Get started by creating your first project using the form on the left.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {projects.map((project) => (
                                    <div
                                        key={project._id}
                                        className="group relative flex items-center justify-between p-4 rounded-xl bg-[#121318] border border-white/10 hover:border-orange-500/40 transition-all duration-200 shadow-md"
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 pr-4">
                                            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Folder className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/projects/${project._id}`}
                                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-orange-400 transition-colors truncate"
                                                >
                                                    <span className="truncate">{project.name}</span>
                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </Link>
                                                
                                                {project.description && (
                                                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                                                        {project.description}
                                                    </p>
                                                )}
                                                
                                                <span className="block text-[10px] text-zinc-500 mt-1.5">
                                                    Created {new Date(project.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(project._id)}
                                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Dashboard