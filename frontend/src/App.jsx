import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './Pages/Register'
import VerifyOTP from './Pages/VerifyOTP'
import Login from './Pages/Login'
import ForgotPassword from './Pages/ForgotPassword'
import ResetPassword from './Pages/ResetPassword'
import Dashboard from './Pages/Dashboard'
import ProjectDetail from './Pages/ProjectDetail'
import Home from './Pages/Home'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
 <Route path="/dash" element={<Dashboard />} />
       <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
    </Routes>
  )
}

export default App