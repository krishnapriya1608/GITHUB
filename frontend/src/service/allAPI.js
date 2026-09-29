import serverURL from './serverURL'
import commonAPI from './commonAPI'

export const registerAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/register`, data)
}

export const loginAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/login`, data)
}

export const verifyOtpAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/verifyOtp`, data)
}

export const resendOtpAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/resendOtp`, data)
}

export const forgotPasswordAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/forgotPassword`, data)
}

export const resetPasswordAPI = async (token, data) => {
    return await commonAPI('POST', `${serverURL}/api/resetPassword/${token}`, data)
}


// ---------------- Projects (require a logged-in user's JWT) ----------------
const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const createProjectAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/api/projects`, data, authHeader())
}

export const getMyProjectsAPI = async () => {
    return await commonAPI('GET', `${serverURL}/api/projects`, {}, authHeader())
}

export const getProjectByIdAPI = async (projectId) => {
    return await commonAPI('GET', `${serverURL}/api/projects/${projectId}`, {}, authHeader())
}

export const updateProjectAPI = async (id, data) => {
    return await commonAPI('PUT', `${serverURL}/api/projects/${id}`, data, authHeader())
}

export const deleteProjectAPI = async (id) => {
    return await commonAPI('DELETE', `${serverURL}/api/projects/${id}`, {}, authHeader())
}

export const uploadProjectZipAPI = async (projectId, formData) => {
    return await commonAPI('POST', `${serverURL}/api/${projectId}/files/upload`, formData, {
        Authorization: `Bearer ${localStorage.getItem("token")}`
        // no Content-Type here - the browser sets the multipart boundary itself
    })
}

export const getProjectFilesAPI = async (projectId) => {
    return await commonAPI('GET', `${serverURL}/api/${projectId}/files`, {}, authHeader())
}

export const getFileByIdAPI = async (projectId, fileId) => {
    return await commonAPI('GET', `${serverURL}/api/${projectId}/files/${fileId}`, {}, authHeader())
}

export const deleteFileAPI = async (projectId, fileId) => {
    return await commonAPI('DELETE', `${serverURL}/api/${projectId}/files/${fileId}`, {}, authHeader())
}

// ---------------- Search, Ask, and indexing ----------------
export const searchProjectAPI = async (projectId, body) => {
    return await commonAPI('POST', `${serverURL}/api/${projectId}/files/search`, body, authHeader())
}

// Streaming chat. axios can't read a response body incrementally in the browser, so this uses fetch.
// Calls the handlers as events arrive: onSources(sources), onToken(text), onDone(), onError(message).
// Pass an AbortSignal to support a Stop button.
export const askProjectStreamAPI = async (projectId, body, handlers, signal) => {
    const { onSources, onToken, onDone, onError } = handlers
    let response
    try {
        response = await fetch(`${serverURL}/api/${projectId}/files/ask-stream`, {
            method: "POST",
            headers: authHeader(),
            body: JSON.stringify(body),
            signal
        })
    } catch (err) {
        if (err.name === "AbortError") return
        onError?.("Could not reach the server.")
        return
    }

    if (!response.ok) {
        let message = "Could not generate an answer"
        try { message = (await response.json()).message || message } catch { /* not JSON */ }
        onError?.(message)
        return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let finished = false

    const handleEvent = (raw) => {
        const line = raw.split("\n").find((l) => l.startsWith("data:"))
        if (!line) return
        let event
        try { event = JSON.parse(line.slice(5).trim()) } catch { return }
        if (event.type === "sources") onSources?.(event.sources)
        else if (event.type === "token") onToken?.(event.text)
        else if (event.type === "error") { finished = true; onError?.(event.message) }
        else if (event.type === "done") { finished = true; onDone?.() }
    }

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            // SSE events are separated by a blank line
            let idx
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
                handleEvent(buffer.slice(0, idx))
                buffer = buffer.slice(idx + 2)
            }
        }
        if (!finished) onDone?.()
    } catch (err) {
        if (err.name === "AbortError") return
        onError?.("The connection was interrupted.")
    }
}

export const askProjectAPI = async (projectId, body) => {
    return await commonAPI('POST', `${serverURL}/api/${projectId}/files/ask`, body, authHeader())
}

export const reindexProjectAPI = async (projectId) => {
    return await commonAPI('POST', `${serverURL}/api/${projectId}/files/reindex`, {}, authHeader())
}

export const getIndexStatusAPI = async (projectId) => {
    return await commonAPI('GET', `${serverURL}/api/${projectId}/files/index-status`, {}, authHeader())
}
export const getChatHistoryAPI = async (projectId) => {
    return await commonAPI('GET', `${serverURL}/api/${projectId}/files/messages`, {}, authHeader())
}

export const clearChatHistoryAPI = async (projectId) => {
    return await commonAPI('DELETE', `${serverURL}/api/${projectId}/files/messages`, {}, authHeader())
}