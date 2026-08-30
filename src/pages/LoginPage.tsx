import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ForgotPasswordModal } from '../components/ForgotPasswordModal'
import '../styles/design-tokens.css'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter both your work email address and password.')
      return
    }

    setIsLoading(true)
    const res = await login(email.trim(), password)
    setIsLoading(false)

    if (res.success) {
      navigate('/dashboard')
    } else {
      setError(res.error || 'Invalid credentials. Please check your email and password.')
    }
  }

  return (
    <div className="brand-page-wrapper">
      {/* Top Promotional Banner */}
      <div className="brand-promo-banner">
        <span className="brand-promo-banner-badge">ENTERPRISE SYSTEM</span>
        <span>Secure Local Credentials Authentication • All Systems Operational</span>
      </div>

      {/* Top Navigation */}
      <header className="brand-nav">
        <div className="brand-nav-left">
          <Link to="/login" className="brand-logo-mark">
            <div className="brand-logo-icon">B</div>
            <span className="brand-logo-text">Bla Expense Hub</span>
          </Link>
        </div>

        <div className="brand-nav-actions">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--charcoal)' }}>
            Enterprise Authentication
          </span>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="brand-main-container">
        {/* Left Side: Form */}
        <section className="brand-auth-pane">
          <div className="brand-auth-header">
            <div className="brand-auth-badge">
              <span>●</span> SECURE ENTERPRISE PORTAL
            </div>
            <h1 className="brand-auth-title">Sign in to Expense Hub</h1>
            <p className="brand-auth-subtitle">
              Enter your work email address and password to access the expense management and reimbursement portal.
            </p>
          </div>

          {error && (
            <div className="brand-alert brand-alert-error" role="alert">
              <span>⚠️</span>&nbsp;{error}
            </div>
          )}

          {/* Form */}
          <form className="brand-form" onSubmit={handleLoginSubmit} noValidate>
            <div className="brand-field">
              <label htmlFor="login-email" className="brand-label">
                Work Email Address
              </label>
              <div className="brand-input-box">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="brand-input"
                  placeholder="e.g. name@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="brand-field">
              <div className="brand-label-row">
                <label htmlFor="login-password" className="brand-label">
                  Password
                </label>
                <button
                  type="button"
                  className="brand-link"
                  onClick={() => setIsForgotModalOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="brand-input-box">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="brand-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="brand-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="brand-form-row">
              <label className="brand-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="brand-checkbox"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              className="brand-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="brand-auth-footer">
            <p>
              Note: Staff accounts are provisioned exclusively by authorized administrators.
            </p>
          </div>
        </section>

        {/* Right Side: Showcase Feature Card (32px rounded) */}
        <section className="brand-showcase-container">
          <div className="brand-feature-card-lavender">
            <div className="brand-feature-card-header">
              <div className="brand-feature-pill">Enterprise Workflow</div>
              <h2 className="brand-feature-title">Streamlined Expense Processing & Direct Disbursement</h2>
              <p className="brand-feature-desc">
                Submit claims with invoice receipts, receive real-time notifications upon approval, and record automated audit trails.
              </p>
            </div>

            {/* Spec Mockup */}
            <div className="brand-product-mockup">
              <div className="brand-mockup-header">
                <div className="brand-mockup-agent-info">
                  <div className="brand-mockup-avatar">₹</div>
                  <div>
                    <div className="brand-mockup-name">Real-Time Claim Pipeline</div>
                    <div style={{ fontSize: '11px', color: 'var(--steel)' }}>
                      Local Credentials Engine
                    </div>
                  </div>
                </div>
                <div className="brand-mockup-status">
                  <span className="brand-mockup-status-dot" />
                  <span>ONLINE</span>
                </div>
              </div>

              <div className="brand-mockup-table">
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Authorized Administrators</span>
                  <span className="brand-mockup-col-badge">Chirag, Pardeep, Mayank</span>
                </div>
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Receipt Document Verification</span>
                  <span className="brand-mockup-col-badge">PDF / Image Formats</span>
                </div>
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Disbursement Tracking</span>
                  <span className="brand-mockup-col-badge">Instant Alerts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-testimonial-card">
            <p className="brand-testimonial-text">
              "The local file credential engine and receipt verification simplified our entire expense approval process."
            </p>
            <div className="brand-testimonial-author">
              <div className="brand-author-avatar">PS</div>
              <div className="brand-author-meta">
                <span className="brand-author-name">Pardeep Sir</span>
                <span className="brand-author-role">Executive Leadership</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Forgot Password Top-Up Card */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Footer */}
      <footer className="brand-footer">
        <div>© 2026 Bla Expense Hub • Local Store Active</div>
        <div className="brand-footer-links">
          <Link to="/privacy" className="brand-footer-link">Privacy Policy</Link>
          <Link to="/terms" className="brand-footer-link">Terms of Service</Link>
          <Link to="/security" className="brand-footer-link">Security Architecture</Link>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
