import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyOtpAPI, resendOtpAPI } from '../service/allAPI'

function VerifyOTP() {
    const navigate = useNavigate()
    const [otp, setOtp] = useState("")
    const email = localStorage.getItem("email")
    console.log("Email:", email);
    console.log("OTP received:", otp);
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (!otp) {
            return alert("Please enter otp")
        }
        if (otp.trim().length < 6) {
            return alert("Please enter a valid otp")
        }

        try {
            const res = await verifyOtpAPI({ email, otp })
            if (res.status === 200) {
                alert(res.data.message)
                navigate("/login")
            } else {
                alert(res.data?.message || "Verification failed")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    const handleResendOtp = async () => {
        if (!email) {
            return alert("No email found, please register again")
        }
        try {
            const res = await resendOtpAPI({ email })
            if (res.status === 200) {
                alert(res.data.message)
            } else {
                alert(res.data?.message || "Could not resend OTP")
            }
        }
        catch (err) {
            console.log(err.message)
            alert("Something went wrong. Please try again.")
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleVerifyOtp} className="auth-form">
                <h2>Verify OTP</h2>
                <p>An OTP was sent to {email}</p>

                <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                />

                <button type="submit">Verify</button>
                <button type="button" onClick={handleResendOtp}>
                    Resend OTP
                </button>
            </form>
        </div>
    )
}

export default VerifyOTP