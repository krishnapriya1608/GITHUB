import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI } from '../service/allAPI'

function Register() {
    const navigate = useNavigate()
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer"
    })

    const handleChange = (e) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        const { name, email, password, role } = data
        if (!name || !email || !password || !role) {
            return alert("Please fill all the fields")
        }
        try {
            const res = await registerAPI(data)
            if (res.status === 200) {
                alert(res.data.message)
                localStorage.setItem("userID", res.data.userID)
                localStorage.setItem("email", email)
                navigate("/verify-otp")
            } else {
                alert(res.data?.message || "Registration failed")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleRegister} className="auth-form">
                <h2>Register</h2>

                <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={data.name}
                    onChange={handleChange}
                />

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

                <select name="role" value={data.role} onChange={handleChange}>
                    <option value="customer">Customer</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="delivery">Delivery</option>
                    <option value="admin">Admin</option>
                </select>

                <button type="submit">Register</button>

                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    )
}

export default Register