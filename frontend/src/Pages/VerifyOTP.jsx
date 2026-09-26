import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { verifyOtpAPI, resendOtpAPI } from '../service/allAPI'
import gsap from 'gsap'

function VerifyOTP() {
    const navigate = useNavigate()
    const [otp, setOtp] = useState("")
    const email = localStorage.getItem("email")

    // GSAP Animation Refs
    const glowRef = useRef(null)
    const headerRef = useRef(null)
    const cardRef = useRef(null)
    const contentRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Background breathing glow animation
            gsap.to(glowRef.current, {
                scale: 1.25,
                opacity: 0.25,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            })

            // 2. Sequential Entrance Timeline
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

            tl.fromTo(headerRef.current,
                { y: -30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 }
            )
            .fromTo(cardRef.current,
                { y: 40, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.9 },
                "-=0.4"
            )
            .fromTo(contentRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
                "-=0.5"
            )
        })

        return () => ctx.revert()
    }, [])

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (!otp) {
            return alert("Please enter OTP")
        }
        if (otp.trim().length < 6) {
            return alert("Please enter a valid 6-digit OTP")
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
        <div className="min-h-screen bg-[#0d0c11] text-white font-sans flex flex-col justify-between relative overflow-hidden">
            {/* Background Purple Glow Effects */}
            <div
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8a72cf]/15 blur-[140px] rounded-full pointer-events-none"
            />

            {/* Navigation Header */}
            <header ref={headerRef} className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                <div style={{ fontFamily: "Arima, system-ui" }} className="font-bold text-xl tracking-wider text-white">
                    COSMOS®
                </div>
                <nav className="flex items-center space-x-8 text-sm text-gray-300">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#team" className="hover:text-white transition-colors">Team</a>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
                <div
                    ref={cardRef}
                    className="w-full p-8 rounded-3xl bg-[#282436]/40 backdrop-blur-xl border border-[#9181c4]/30 shadow-2xl space-y-6 text-center"
                >
                    <div ref={(el) => (contentRef.current[0] = el)} className="space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#3f3a52]/60 flex items-center justify-center border border-[#9181c4]/30">
                            <svg className="w-6 h-6 text-[#9181c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                            Verify OTP
                        </h2>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            An OTP has been sent to <br />
                            <span className="text-white font-medium">{email || "your registered email"}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div ref={(el) => (contentRef.current[1] = el)} className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-gray-300 tracking-wide">
                                Enter 6-Digit Code
                            </label>
                            <input
                                type="text"
                                name="otp"
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full text-center tracking-[0.5em] font-mono text-lg py-3.5 rounded-2xl bg-[#3f3a52]/50 border border-transparent focus:border-[#9181c4]/60 text-white placeholder-gray-500 outline-none transition-all"
                            />
                        </div>

                        <div ref={(el) => (contentRef.current[2] = el)} className="space-y-3">
                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-2xl bg-[#8a86a4] hover:bg-[#7b71ba] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#8c82cb]/20 active:scale-[0.98]"
                            >
                                Verify & Continue
                            </button>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Didn't receive code? <span className="text-[#9181c4] font-semibold hover:underline">Resend OTP</span>
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer Bar */}
            <footer className="relative z-10 w-full px-8 py-4 flex items-center justify-between text-[10px] text-gray-600 border-t border-white/5">
                <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    <span>Cosmos</span>
                </div>
                <div>
                    copyright <span className="font-semibold text-gray-400">@ 2026</span>
                </div>
            </footer>
        </div>
    )
}

export default VerifyOTP