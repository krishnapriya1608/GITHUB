import React, { useState } from 'react'
import { forgotPasswordAPI } from '../service/allAPI'

function ForgotPassword() {
    const [email, setEmail] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) {
            return alert("Please enter your email")
        }
        try {
            const res = await forgotPasswordAPI({ email })
            if (res.status === 200) {
                alert(res.data.message)
            } else {
                alert(res.data?.message || "Could not send reset link")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Forgot Password</h2>
                <p>Enter your email and we'll send you a reset link.</p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button type="submit">Send Reset Link</button>
            </form>
        </div>
    )
}

export default ForgotPassword