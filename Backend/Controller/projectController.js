const Project = require('../Schema/projectSchema')

// ---------------- CREATE PROJECT ----------------
exports.createProject = async (req, res) => {
    console.log("Inside create project")
    try {
        const { name, description } = req.body
        if (!name) {
            return res.status(400).json({ message: "Project name is required" })
        }

        const project = new Project({
            name,
            description,
            owner: req.user.id
        })

        await project.save()
        res.status(201).json({ message: "Project created successfully", project })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- GET ALL PROJECTS FOR LOGGED-IN USER ----------------
exports.getMyProjects = async (req, res) => {
    console.log("Inside get my projects")
    try {
        const projects = await Project.find({ owner: req.user.id }).sort({ createdAt: -1 })
        res.status(200).json({ message: "Projects fetched successfully", projects })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- GET A SINGLE PROJECT ----------------
exports.getProjectById = async (req, res) => {
    console.log("Inside get project by id")
    try {
        const { id } = req.params
        const project = await Project.findOne({ _id: id, owner: req.user.id })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        res.status(200).json({ message: "Project fetched successfully", project })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- UPDATE PROJECT ----------------
exports.updateProject = async (req, res) => {
    console.log("Inside update project")
    try {
        const { id } = req.params
        const { name, description } = req.body

        const project = await Project.findOne({ _id: id, owner: req.user.id })
        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        if (name !== undefined) project.name = name
        if (description !== undefined) project.description = description
        await project.save()

        res.status(200).json({ message: "Project updated successfully", project })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ---------------- DELETE PROJECT ----------------
exports.deleteProject = async (req, res) => {
    console.log("Inside delete project")
    try {
        const { id } = req.params
        const project = await Project.findOneAndDelete({ _id: id, owner: req.user.id })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        res.status(200).json({ message: "Project deleted successfully" })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}