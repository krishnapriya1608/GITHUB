// Downloads a PUBLIC GitHub repo as a zip so it can go through the same pipeline
// as a manual .zip upload. Optional: set GITHUB_TOKEN in Backend/.env.

const MAX_ZIP_BYTES = 100 * 1024 * 1024
const NAME_RE = /^[A-Za-z0-9_.-]+$/

class ImportError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

// Accepts: https://github.com/owner/repo, .../repo.git, .../repo/tree/<branch>
const parseGithubUrl = (input) => {
    let url
    try {
        url = new URL(String(input || '').trim())
    } catch {
        throw new ImportError(400, 'Enter a valid GitHub repository URL')
    }
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname)) {
        throw new ImportError(400, 'Only https://github.com/... URLs are supported')
    }

    const [owner, rawRepo, kind, branch] = url.pathname.split('/').filter(Boolean)
    const repo = rawRepo ? rawRepo.replace(/\.git$/, '') : ''
    if (!owner || !repo || !NAME_RE.test(owner) || !NAME_RE.test(repo)) {
        throw new ImportError(400, 'URL must look like https://github.com/owner/repo')
    }
    const ref = kind === 'tree' && branch && NAME_RE.test(branch) ? branch : null
    return { owner, repo, ref }
}

const downloadRepoZip = async (input) => {
    const { owner, repo, ref } = parseGithubUrl(input)

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball${ref ? `/${ref}` : ''}`
    const headers = { 'User-Agent': 'code-assistant-import', Accept: 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

    let res
    try {
        res = await fetch(apiUrl, { headers, redirect: 'follow', signal: AbortSignal.timeout(60_000) })
    } catch {
        throw new ImportError(502, 'Could not reach GitHub. Try again in a moment.')
    }

    if (res.status === 404) throw new ImportError(404, 'Repository (or branch) not found, or it is private')
    if (res.status === 403 || res.status === 429) {
        throw new ImportError(429, 'GitHub rate limit reached. Try again later.')
    }
    if (!res.ok) throw new ImportError(502, `GitHub returned ${res.status}`)

    if (Number(res.headers.get('content-length') || 0) > MAX_ZIP_BYTES) {
        throw new ImportError(413, 'Repository is larger than 100 MB')
    }

    const chunks = []
    let size = 0
    for await (const chunk of res.body) {
        size += chunk.length
        if (size > MAX_ZIP_BYTES) throw new ImportError(413, 'Repository is larger than 100 MB')
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}

module.exports = { downloadRepoZip, parseGithubUrl, ImportError }