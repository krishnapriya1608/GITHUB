import serverURL from './serverURL'
import commonAPI from './commonAPI'

export const registerAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/register`, data)
}

export const loginAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/login`, data)
}

export const verifyOtpAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/verifyOtp`, data)
}

export const resendOtpAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/resendOtp`, data)
}

export const forgotPasswordAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/forgotPassword`, data)
}

export const resetPasswordAPI = async (token, data) => {
    return await commonAPI('POST', `${serverURL}/resetPassword/${token}`, data)
}


// ---------------- Projects (require a logged-in user's JWT) ----------------
const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const createProjectAPI = async (data) => {
    return await commonAPI('POST', `${serverURL}/projects`, data, authHeader())
}

export const getMyProjectsAPI = async () => {
    return await commonAPI('GET', `${serverURL}/projects`, {}, authHeader())
}

export const getProjectByIdAPI = async (id) => {
    return await commonAPI('GET', `${serverURL}/projects/${id}`, {}, authHeader())
}

export const updateProjectAPI = async (id, data) => {
    return await commonAPI('PUT', `${serverURL}/projects/${id}`, data, authHeader())
}

export const deleteProjectAPI = async (id) => {
    return await commonAPI('DELETE', `${serverURL}/projects/${id}`, {}, authHeader())
}