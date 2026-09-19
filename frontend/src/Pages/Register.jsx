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
        <div className="min-h-screen bg-[#0d0c11] text-white font-sans flex flex-col justify-between relative overflow-hidden">
            {/* Background Purple Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8a72cf]/15 blur-[140px] rounded-full pointer-events-none" />

            {/* Navigation Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="font-bold text-xl tracking-wider text-white">LOGO</div>
                <nav className="flex items-center space-x-8 text-sm text-gray-300">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#team" className="hover:text-white transition-colors">Team</a>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                    
                    {/* Left Column: Heading & Social Login */}
                    <div className="lg:col-span-6 space-y-6">
                        <h1 className="text-5xl font-black tracking-tight text-white uppercase">
                            REGISTER
                        </h1>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            Hey, welcome! <br />
                            Create your account to get started with us today.
                        </p>

                        <div className="pt-2">
                            <button
                                type="button"
                                className="flex items-center justify-center space-x-3 w-full sm:w-auto px-6 py-3 rounded-full border border-gray-700/80 bg-black/40 hover:bg-black/60 text-sm font-medium transition-all duration-200"
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
                                <span>Register with google</span>
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm pt-4">
                            Already a member?{" "}
                            <Link to="/login" className="font-bold text-white hover:underline ml-1">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Right Column: Glassmorphism Card Form */}
                    <div className="lg:col-span-6 flex justify-center lg:justify-end">
                        <div className="w-full max-w-md p-8 rounded-3xl bg-[#282436]/40 backdrop-blur-xl border border-[#9181c4]/30 shadow-2xl space-y-5">
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300 tracking-wide">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="E.g. John Doe"
                                        value={data.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#3f3a52]/50 border border-transparent focus:border-[#9181c4]/60 text-sm text-white placeholder-gray-400 outline-none transition-all"
                                    />
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300 tracking-wide">
                                        E-Mail
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="E.g. coursecrates@gmail.com"
                                        value={data.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#3f3a52]/50 border border-transparent focus:border-[#9181c4]/60 text-sm text-white placeholder-gray-400 outline-none transition-all"
                                    />
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300 tracking-wide">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••••••"
                                        value={data.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#3f3a52]/50 border border-transparent focus:border-[#9181c4]/60 text-sm text-white placeholder-gray-400 outline-none transition-all"
                                    />
                                </div>

                                {/* Role Select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-300 tracking-wide">
                                        Select Role
                                    </label>
                                    <select
                                        name="role"
                                        value={data.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#3f3a52]/50 border border-transparent focus:border-[#9181c4]/60 text-sm text-white outline-none transition-all cursor-pointer"
                                    >
                                        <option value="customer" className="bg-[#282436]">Customer</option>
                                        <option value="waiter" className="bg-[#282436]">Waiter</option>
                                        <option value="kitchen" className="bg-[#282436]">Kitchen</option>
                                        <option value="delivery" className="bg-[#282436]">Delivery</option>
                                        <option value="admin" className="bg-[#282436]">Admin</option>
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full py-3.5 mt-2 rounded-2xl bg-[#8c82cb] hover:bg-[#7b71ba] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#8c82cb]/20"
                                >
                                    REGISTER
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Bar */}
            <footer className="relative z-10 w-full bg-[#8c82cb]/80 backdrop-blur-md py-3 text-center text-xs font-medium text-white/90 border-t border-white/10">
                © Copyright 2026
            </footer>
        </div>
    )
}

export default Register