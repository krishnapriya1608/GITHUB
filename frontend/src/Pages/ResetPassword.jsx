import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resetPasswordAPI } from '../service/allAPI'

function ResetPassword() {
    const navigate = useNavigate()
    const { token } = useParams()
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) {
            return alert("Please fill all the fields")
        }
        if (newPassword !== confirmPassword) {
            return alert("Passwords do not match")
        }
        try {
            const res = await resetPasswordAPI(token, { newPassword })
            if (res.status === 200) {
                alert(res.data.message)
                navigate("/login")
            } else {
                alert(res.data?.message || "Could not reset password")
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
                <h2>Reset Password</h2>

                <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button type="submit">Reset Password</button>
            </form>
        </div>
    )
}

export default ResetPassword