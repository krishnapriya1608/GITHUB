import axios from 'axios'

const commonAPI = async (method, url, reqBody, reqHeader) => {
    const reqConfig = {
        method,
        url,
        data: reqBody,
        headers: reqHeader ? reqHeader : { "Content-Type": "application/json" }
    }
    try {
        const result = await axios(reqConfig)
        return result
    }
    catch (err) {
        if (err.response) {
            return err.response
        }
        throw err
    }
}

export default commonAPI