// Deterministic code analysis: no LLM involved, so results are always exact,
// instant, and free. Built entirely from what's already stored in Mongo.
//
// Patterns are dispatched by file extension rather than run against every
// file indiscriminately - e.g. the Express pattern for "app.get(" would
// otherwise also match inside Python's "@app.get(...)" decorator, since it
// doesn't care what comes before "app.". Keeping languages separate avoids
// that kind of cross-language false positive and double-counting.

const JS_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"])
const PY_EXTENSIONS = new Set([".py"])

// ---------------- FOLDER TREE ----------------
// files: [{ path, filename, extension, language, type, size }]
const buildFileTree = (files) => {
    const root = { name: "", type: "folder", children: {} }

    for (const file of files) {
        const parts = file.path ? file.path.split('/').filter(Boolean) : []
        let node = root

        for (const part of parts) {
            if (!node.children[part]) {
                node.children[part] = { name: part, type: "folder", children: {} }
            }
            node = node.children[part]
        }

        node.children[file.filename] = {
            name: file.filename,
            type: "file",
            language: file.language,
            size: file.size
        }
    }

    const toArray = (node) => {
        const kids = Object.values(node.children).map((c) => (c.type === "folder" ? toArray(c) : c))
        kids.sort((a, b) => {
            if (a.type !== b.type) return a.type === "folder" ? -1 : 1
            return a.name.localeCompare(b.name)
        })
        return { name: node.name, type: "folder", children: kids }
    }

    return toArray(root).children
}

// ---------------- API ENDPOINTS ----------------
const JS_ENDPOINT_PATTERN = /\b(?:router|app)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g

const PY_ENDPOINT_PATTERNS = [
    // FastAPI: @app.get("/path"), @router.post("/path")
    { re: /@(?:app|router)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g, style: "single" },
    // Flask: @app.route("/path", methods=["GET", "POST"])
    { re: /@(?:app|blueprint)\.route\(\s*['"]([^'"]+)['"](?:\s*,\s*methods\s*=\s*\[([^\]]*)\])?/g, style: "flask" }
]

const detectEndpoints = (files) => {
    const endpoints = []

    for (const file of files) {
        if (file.type !== "code") continue
        const location = file.path ? `${file.path}/${file.filename}` : file.filename

        if (JS_EXTENSIONS.has(file.extension)) {
            JS_ENDPOINT_PATTERN.lastIndex = 0
            let match
            while ((match = JS_ENDPOINT_PATTERN.exec(file.content)) !== null) {
                endpoints.push({ method: match[1].toUpperCase(), path: match[2], file: location })
            }
        } else if (PY_EXTENSIONS.has(file.extension)) {
            for (const { re, style } of PY_ENDPOINT_PATTERNS) {
                re.lastIndex = 0
                let match
                while ((match = re.exec(file.content)) !== null) {
                    if (style === "flask") {
                        const methods = match[2]
                            ? match[2].split(',').map((m) => m.trim().replace(/['"]/g, ''))
                            : ["GET"]
                        for (const method of methods) {
                            endpoints.push({ method, path: match[1], file: location })
                        }
                    } else {
                        endpoints.push({ method: match[1].toUpperCase(), path: match[2], file: location })
                    }
                }
            }
        }
    }

    endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
    return endpoints
}

// ---------------- FUNCTIONS / CLASSES PER FILE ----------------
const JS_SYMBOL_PATTERNS = [
    { re: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/gm, kind: "function" },
    { re: /^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)/gm, kind: "class" },
    { re: /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm, kind: "function" },
    { re: /^\s*(?:exports\.(\w+)|module\.exports\.(\w+))\s*=/gm, kind: "function" }
]

const PY_SYMBOL_PATTERNS = [
    { re: /^\s*(?:async\s+)?def\s+(\w+)/gm, kind: "function" },
    { re: /^\s*class\s+(\w+)/gm, kind: "class" }
]

const detectSymbols = (files) => {
    const out = []

    for (const file of files) {
        if (file.type !== "code") continue

        const patterns = JS_EXTENSIONS.has(file.extension)
            ? JS_SYMBOL_PATTERNS
            : PY_EXTENSIONS.has(file.extension)
            ? PY_SYMBOL_PATTERNS
            : null
        if (!patterns) continue

        const symbols = []
        for (const { re, kind } of patterns) {
            re.lastIndex = 0
            let match
            while ((match = re.exec(file.content)) !== null) {
                const name = match[1] || match[2]
                if (name) symbols.push({ name, kind })
            }
        }

        if (symbols.length > 0) {
            out.push({
                filename: file.filename,
                path: file.path || "",
                symbols: symbols.slice(0, 30) // keep the response reasonable for very large files
            })
        }
    }

    return out
}

module.exports = { buildFileTree, detectEndpoints, detectSymbols }