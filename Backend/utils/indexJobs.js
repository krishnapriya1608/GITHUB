// Tracks background indexing per project (in memory; resets if the server restarts).
// The upload request returns as soon as files are saved; indexing continues here
// and the frontend polls /index-status to show progress.

const indexFiles = require('./indexFile')

const jobs = new Map()

const getJob = (projectId) => jobs.get(projectId.toString()) || { state: 'idle' }
const isRunning = (projectId) => getJob(projectId).state === 'indexing'

const update = (projectId, patch) => {
    const key = projectId.toString()
    jobs.set(key, { ...(jobs.get(key) || {}), ...patch })
}

const startIndexJob = (projectId, files) => {
    update(projectId, { state: 'indexing', done: 0, total: 0, chunksStored: 0, error: null })

    // deliberately not awaited: runs in the background
    indexFiles(projectId, files, ({ done, total }) => update(projectId, { done, total }))
        .then(({ chunksStored, total, error }) => {
            update(projectId, {
                state: error ? 'error' : 'done',
                chunksStored,
                total,
                done: error ? getJob(projectId).done : total,
                error
            })
        })
        .catch((err) => update(projectId, { state: 'error', error: err.message }))
}

module.exports = { startIndexJob, getJob, isRunning }