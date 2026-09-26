import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createProjectAPI, getMyProjectsAPI, deleteProjectAPI } from '../service/allAPI'

function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [projects, setProjects] = useState([])
    const [form, setForm] = useState({ name: "", description: "" })
    const [loading, setLoading] = useState(true)

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
                setProjects(res.data.projects)
            } else if (res.status === 401) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                navigate("/login")
            } else {
                alert(res.data?.message || "Could not load projects")
            }
        }
        catch (err) {
            console.log(err.message)
        }
        finally {
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
        try {
            const res = await createProjectAPI(form)
            if (res.status === 201) {
                setProjects([res.data.project, ...projects])
                setForm({ name: "", description: "" })
            } else {
                alert(res.data?.message || "Could not create project")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this project?")) return
        try {
            const res = await deleteProjectAPI(id)
            if (res.status === 200) {
                setProjects(projects.filter((p) => p._id !== id))
            } else {
                alert(res.data?.message || "Could not delete project")
            }
        }
        catch (err) {
            console.log(err.message)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-[#0e0f12] text-[#e0e1e6] font-sans relative overflow-x-hidden p-6 sm:p-12">
            {/* Header bar */}
            <header className="max-w-4xl mx-auto flex items-center justify-between pb-8 border-b border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                    <h2 className="text-xl font-light tracking-wide text-white">
                        Welcome, <span className="font-semibold">{user?.name || 'User'}</span>
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-1.5 rounded-full bg-[#1b1c22] hover:bg-[#252730] border border-white/10 text-xs text-gray-400 hover:text-white transition-all duration-200"
                >
                    Logout
                </button>
            </header>

            <main className="max-w-4xl mx-auto mt-10 space-y-12">
                {/* Step 1 Card: Create Project */}
                <div className="relative rounded-2xl bg-[#17181f]/80 border border-white/10 p-6 sm:p-8 backdrop-blur-md shadow-2xl overflow-hidden">
                    {/* Top Mac-style dots */}
                    <div className="flex items-center space-x-2 mb-6">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                    </div>

                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-500 mb-1">
                        STEP 1
                    </div>
                    <h3 className="text-2xl font-normal text-white mb-6">Create New Project</h3>

                    <form onSubmit={handleCreate} className="space-y-4 max-w-md">
                        <input
                            type="text"
                            name="name"
                            placeholder="Project name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f1015] border border-white/10 focus:border-orange-500/60 text-xs text-white placeholder-gray-500 outline-none transition-all duration-200"
                        />
                        <input
                            type="text"
                            name="description"
                            placeholder="Description (optional)"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-[#0f1015] border border-white/10 focus:border-orange-500/60 text-xs text-white placeholder-gray-500 outline-none transition-all duration-200"
                        />
                        <button
                            type="submit"
                            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-black font-semibold text-xs tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                        >
                            <span>+ New Project</span>
                            <span>→</span>
                        </button>
                    </form>
                </div>

                {/* Vertical Connecting Glow Line */}
                <div className="flex justify-start ml-12 -my-6">
                    <div className="w-[2px] h-12 bg-gradient-to-b from-orange-500/80 to-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                </div>

                {/* Step 2 Card: Projects List Flow */}
                <div className="relative rounded-2xl bg-[#17181f]/80 border border-white/10 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-500 mb-1">
                        STEP 2
                    </div>
                    <h3 className="text-2xl font-normal text-white mb-6">Your Project Nodes</h3>

                    {loading ? (
                        <div className="py-8 text-center text-xs text-gray-500 tracking-wider">
                            Loading projects...
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-500 tracking-wider">
                            No projects yet. Create your first one above.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {projects.map((project) => (
                                <div
                                    key={project._id}
                                    className="group relative flex items-center justify-between p-4 rounded-xl bg-[#0f1015] border border-orange-500/30 hover:border-orange-500/80 transition-all duration-300 shadow-md"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-5 h-5 rounded-full border border-orange-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        </div>
                                        <div>
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="text-sm font-medium text-white hover:text-orange-400 transition-colors"
                                            >
                                                {project.name}
                                            </Link>
                                            {project.description && (
                                                <p className="text-xs text-gray-400 font-light mt-0.5">
                                                    {project.description}
                                                </p>
                                            )}
                                            <span className="block text-[10px] text-gray-600 mt-1">
                                                Created {new Date(project.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(project._id)}
                                        className="text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1 rounded-md hover:bg-red-500/10"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Dashboard