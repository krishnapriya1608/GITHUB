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
        <div className="dashboard">
            <header className="dashboard-header">
                <h2>{user?.name}</h2>
                <button type="button" onClick={handleLogout}>Logout</button>
            </header>

            <form onSubmit={handleCreate} className="project-form">
                <input
                    type="text"
                    name="name"
                    placeholder="Project name"
                    value={form.name}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={handleChange}
                />
                <button type="submit">+ New Project</button>
            </form>

            {loading ? (
                <p>Loading projects...</p>
            ) : projects.length === 0 ? (
                <p>No projects yet. Create your first one above.</p>
            ) : (
                <ul className="project-tree">
                    {projects.map((project) => (
                        <li key={project._id} className="project-item">
                            <div>
                                <Link to={`/projects/${project._id}`}>
                                    <strong>{project.name}</strong>
                                </Link>
                                {project.description && <p>{project.description}</p>}
                                <span className="project-date">
                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button type="button" onClick={() => handleDelete(project._id)}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Dashboard