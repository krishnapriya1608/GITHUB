import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAPI } from '../service/allAPI'

function Login() {
    const navigate = useNavigate()
    const [data, setData] = useState({ email: "", password: "" })
    const [showPassword, setShowPassword] = useState(false)

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
                navigate("/dash")
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
        <div className="min-h-screen  bg-[#0d0c11]  text-[#e1e2e6] font-sans flex flex-col justify-between relative overflow-hidden">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8a72cf]/15 blur-[140px] rounded-full pointer-events-none" />
               {/* Top Navigation Brand */}
            <header className="relative z-10 px-8 py-6 max-w-7xl w-full">
                <div className="font-bold text-xs tracking-[0.3em] uppercase text-gray-300">
                    COSMOS<span className="text-[9px] align-top">®</span>
                </div>
            </header>

            {/* Main Content Split View */}
            <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto w-full items-center px-6">
                
                {/* Left Side: Minimal Visual Graphic / Orb Ring */}
                <div className="hidden lg:flex lg:col-span-6 items-center justify-center p-12">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Circle pattern recreating the graphic */}
                        {[...Array(7)].map((_, index) => {
                            const angle = (index * (360 / 7)) * (Math.PI / 180);
                            const radius = 80;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            return (
                                <div
                                    key={index}
                                    style={{
                                        transform: `translate(${x}px, ${y}px)`,
                                    }}
                                    className={`absolute w-7 h-7 rounded-full shadow-inner transition-all duration-500 ${
                                        index === 1
                                            ? "bg-gradient-to-tr from-indigo-600 to-blue-400 opacity-90 shadow-indigo-500/50"
                                            : "bg-gradient-to-b from-[#2a2d34] to-[#16181d] opacity-60 border border-white/5"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Elegant Dark Form */}
                <div className="col-span-12 lg:col-span-6 flex justify-center lg:justify-start lg:pl-12">
                    <div className="w-full max-w-sm space-y-6">
                        
                        {/* Dot Circle Header Icon */}
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="grid grid-cols-3 gap-1.5 w-10 h-6 items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-transparent mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto" />
                            </div>

                            <h1 className="text-2xl font-serif tracking-tight text-white font-normal pt-1">
                                Sign in
                            </h1>

                            <p className="text-xs text-gray-500 font-light">
                                or <span className="underline decoration-gray-600 underline-offset-4 cursor-pointer hover:text-gray-300 transition-colors">enter an invite code</span>
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-3 pt-2">
                            {/* Email / Username Input */}
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email or username"
                                    value={data.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-[#191a1f] border border-white/5 focus:border-white/20 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200"
                                />
                            </div>

                            {/* Password Input with Toggle */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-[#191a1f] border border-white/5 focus:border-white/20 text-xs text-white placeholder-gray-500 outline-none transition-all duration-200 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.682-.713c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-3 mt-1 rounded-full bg-white text-[#0d0e11] font-semibold text-xs tracking-tight hover:bg-gray-200 transition-all duration-200 shadow-md"
                            >
                                Enter
                            </button>
                        </form>

                        {/* Additional Navigation Links */}
                        <div className="text-center space-y-2 pt-2">
                            <div>
                                <Link
                                    to="/forgot-password"
                                    className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="text-[11px] text-gray-500">
                                Don't have an account?{" "}
                                <Link
                                    to="/"
                                    className="text-gray-300 hover:text-white underline underline-offset-2 ml-1 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

            </main>

            {/* Footer Bar */}
            <footer className="relative z-10 w-full px-8 py-4 flex items-center justify-between text-[10px] text-gray-600 border-t border-white/5">
                <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    <span>Cosmos</span>
                </div>
                <div>
                     <span className="font-semibold text-gray-400"></span>
                </div>
            </footer>
            
        </div>
    )
}

export default Login