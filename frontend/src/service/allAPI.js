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

export const searchProjectAPI = async (projectId, body) => {
    return await commonAPI('POST', `${serverURL}/api/${projectId}/files/search`, body, authHeader())
}