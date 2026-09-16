import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './Pages/Register'
import VerifyOTP from './Pages/VerifyOTP'
import Login from './Pages/Login'
import ForgotPassword from './Pages/ForgotPassword'
import ResetPassword from './Pages/ResetPassword'
import './App.css'

function Home() {
  return (
    <div className="auth-page">
      <h1>Welcome</h1>
      <p>You are logged in.</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default App