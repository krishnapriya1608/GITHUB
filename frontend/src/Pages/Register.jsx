import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI } from '../service/allAPI'
import gsap from 'gsap'

function Register() {
    const navigate = useNavigate()
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        role: "customer"
    })

    // GSAP Animation Refs
    const glowRef = useRef(null)
    const headerRef = useRef(null)
    const leftColRef = useRef(null)
    const cardRef = useRef(null)
    const formFieldsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Glowing background pulse animation
            gsap.to(glowRef.current, {
                scale: 1.25,
                opacity: 0.35,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            })

            // Timeline for smooth staggered entrance
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

            tl.fromTo(headerRef.current, 
                { y: -30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.8 }
            )
            .fromTo(leftColRef.current?.children, 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }, 
                "-=0.4"
            )
            .fromTo(cardRef.current, 
                { y: 40, opacity: 0, scale: 0.95 }, 
                { y: 0, opacity: 1, scale: 1, duration: 1 }, 
                "-=0.6"
            )
            .fromTo(formFieldsRef.current, 
                { y: 20, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, 
                "-=0.4"
            )
        })

        return () => ctx.revert()
    }, [])

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
        <div className="min-h-screen bg-[#09080e] text-white font-sans flex flex-col justify-between relative overflow-hidden selection:bg-[#9181c4]/30 selection:text-white">
            
            {/* Ambient Background Glows */}
            <div 
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#7c5cdb]/20 blur-[150px] rounded-full pointer-events-none" 
            />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#4c3882]/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Navigation Header */}
            <header ref={headerRef} className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                <div style={{ fontFamily: "Arima, system-ui" }} className="font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-400">
                    Codebase®
                </div>
                <nav style={{ fontFamily: "Arima, system-ui" }} className="flex items-center space-x-8 text-sm font-medium text-gray-300">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#team" className="hover:text-white transition-colors">Team</a>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                    
                    {/* Left Column: Heading & Social Login */}
                    <div ref={leftColRef} className="lg:col-span-6 space-y-6">
                        <div className="space-y-2">
                            <span style={{ fontFamily: "Arima, system-ui" }} className="text-xs font-semibold tracking-widest text-[#a895e2] uppercase">
                                Get Started Free
                            </span>
                            <h1 style={{ fontFamily: "Arima, system-ui" }} className="text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none">
                                REGISTER
                            </h1>
                        </div>

                        <p style={{ fontFamily: "Arima, system-ui" }} className="text-gray-400 text-base leading-relaxed max-w-sm">
                            Hey, welcome! <br />
                            Create your account to unlock full access and get started with us today.
                        </p>

                        <div className="pt-2">
                            <button
                                style={{ fontFamily: "Arima, system-ui" }}
                                type="button"
                                className="flex items-center justify-center space-x-3 w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-gray-200 transition-all duration-300 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#EA4335"
                                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"
                                    />
                                </svg>
                                <span>Register with Google</span>
                            </button>
                        </div>

                        <p style={{ fontFamily: "Arima, system-ui" }} className="text-gray-400 text-sm pt-2">
                            Already a member?{" "}
                            <Link style={{ fontFamily: "Arima, system-ui" }} to="/login" className="font-semibold text-purple-300 hover:text-white hover:underline transition-colors ml-1">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Right Column: Glassmorphism Card Form */}
                    <div className="lg:col-span-6 flex justify-center lg:justify-end">
                        <div 
                            ref={cardRef} 
                            className="w-full max-w-md p-8 rounded-3xl bg-[#1a1726]/60 backdrop-blur-2xl border border-[#a895e2]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6"
                        >
                            <form style={{ fontFamily: "Arima, system-ui" }} onSubmit={handleRegister} className="space-y-4">
                                
                                {/* Name Input */}
                                <div ref={(el) => (formFieldsRef.current[0] = el)} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-300 tracking-wider uppercase">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="E.g. John Doe"
                                        value={data.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-[#2a243a]/60 border border-white/5 focus:border-[#a895e2]/60 focus:bg-[#2a243a]/90 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 shadow-inner"
                                    />
                                </div>

                                {/* Email Input */}
                                <div ref={(el) => (formFieldsRef.current[1] = el)} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-300 tracking-wider uppercase">
                                        E-Mail Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="E.g. coursecrates@gmail.com"
                                        value={data.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-[#2a243a]/60 border border-white/5 focus:border-[#a895e2]/60 focus:bg-[#2a243a]/90 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 shadow-inner"
                                    />
                                </div>

                                {/* Password Input */}
                                <div ref={(el) => (formFieldsRef.current[2] = el)} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-300 tracking-wider uppercase">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••••••"
                                        value={data.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-[#2a243a]/60 border border-white/5 focus:border-[#a895e2]/60 focus:bg-[#2a243a]/90 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 shadow-inner"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div ref={(el) => (formFieldsRef.current[3] = el)} className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8a72cf] to-[#6d52b8] hover:from-[#9881db] hover:to-[#795dc7] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#7c5cdb]/30 active:scale-[0.98] border border-white/10"
                                    >
                                        Register Now
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Bar */}
            <footer className="relative z-10 w-full px-8 py-5 flex items-center justify-between text-xs text-gray-500 border-t border-white/5 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="font-medium text-gray-400">Codebase Platform</span>
                </div>
                <div>
                    Copyright <span className="font-medium text-gray-400">© 2026</span>
                </div>
            </footer>
        </div>
    )
}

export default Register