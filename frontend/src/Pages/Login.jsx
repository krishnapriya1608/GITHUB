import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAPI } from '../service/allAPI'

function Login() {
    const navigate = useNavigate()
    const [data, setData] = useState({ email: "", password: "" })

    const handleChange = (e) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
        })
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        const { email, password } = data
        if (!email || !password) {
            return alert("Please fill all the fields")
        }
        try {
            const res = await loginAPI(data)
            if (res.status === 200) {
                localStorage.setItem("token", res.data.token)
                localStorage.setItem("user", JSON.stringify(res.data.user))
                alert(res.data.message)
                navigate("/")
            } else {
                alert(res.data?.message || "Login failed")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleLogin} className="auth-form">
                <h2>Login</h2>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={data.email}
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={data.password}
                    onChange={handleChange}
                />

                <button type="submit">Login</button>

                <p>
                    <Link to="/forgot-password">Forgot password?</Link>
                </p>
                <p>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    )
}

export default Login