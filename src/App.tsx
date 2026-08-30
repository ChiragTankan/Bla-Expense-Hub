import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { ModernLoginPage } from './pages/ModernLoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login-v2" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-v2" element={<ModernLoginPage />} />
        <Route path="/design-login" element={<ModernLoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
