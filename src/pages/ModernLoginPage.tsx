import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/design-tokens.css'

export const ModernLoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please enter both your work email and password.' })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setMessage({
        type: 'success',
        text: `Welcome back! Signed in as ${email}.`,
      })
    }, 750)
  }

  return (
    <div className="brand-page-wrapper">
      {/* Top Navigation */}
      <header className="brand-nav">
        <div className="brand-nav-left">
          <Link to="/login-v2" className="brand-logo-mark">
            <div className="brand-logo-icon">B</div>
            <span className="brand-logo-text">Bla Platform</span>
          </Link>
        </div>

        <nav className="brand-nav-links">
          <Link to="/features" className="brand-nav-link">Product</Link>
          <Link to="/solutions" className="brand-nav-link">Solutions</Link>
          <Link to="/pricing" className="brand-nav-link">Pricing</Link>
        </nav>

        <div className="brand-nav-actions">
          <Link to="/login" className="brand-nav-link">Simple Login</Link>
          <Link to="/signup" className="brand-btn-primary" style={{ height: '36px', padding: '0 16px', textDecoration: 'none' }}>
            Try free
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="brand-main-container">
        {/* Left Side: Sign in Form */}
        <section className="brand-auth-pane">
          <div className="brand-auth-header">
            <div className="brand-auth-badge">
              <span>●</span> Data & Automation Platform
            </div>
            <h1 className="brand-auth-title">Sign in to your account</h1>
            <p className="brand-auth-subtitle">
              Enter your work credentials to access your data enrichment pipelines and workflows.
            </p>
          </div>

          {message && (
            <div
              className={`brand-alert ${
                message.type === 'success' ? 'brand-alert-success' : 'brand-alert-error'
              }`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* Social / SSO Action */}
          <button
            type="button"
            className="brand-sso-btn"
            onClick={() => setMessage({ type: 'success', text: 'Redirecting to Google SSO...' })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="brand-divider">
            <div className="brand-divider-line" />
            <span className="brand-divider-text">or with work email</span>
            <div className="brand-divider-line" />
          </div>

          {/* Form */}
          <form className="brand-form" onSubmit={handleSubmit} noValidate>
            <div className="brand-field">
              <label htmlFor="modern-email" className="brand-label">
                Work email
              </label>
              <div className="brand-input-box">
                <input
                  id="modern-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="brand-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="brand-field">
              <div className="brand-label-row">
                <label htmlFor="modern-password" className="brand-label">
                  Password
                </label>
                <Link to="/forgot-password" className="brand-link">
                  Forgot password?
                </Link>
              </div>
              <div className="brand-input-box">
                <input
                  id="modern-password"
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
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              className="brand-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="brand-auth-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="brand-link">
              Create an account
            </Link>
          </div>
        </section>

        {/* Right Side: Saturated Feature Card & UI Mockup */}
        <section className="brand-showcase-container">
          <div className="brand-feature-card-lavender">
            <div className="brand-feature-card-header">
              <div className="brand-feature-pill">Intelligent Data Engine</div>
              <h2 className="brand-feature-title">Automate custom research and enrichment at scale.</h2>
              <p className="brand-feature-desc">
                Connect your database to 50+ real-time data providers and autonomous agents to enrich contacts in seconds.
              </p>
            </div>

            {/* Product UI Mockup */}
            <div className="brand-product-mockup">
              <div className="brand-mockup-header">
                <div className="brand-mockup-agent-info">
                  <div className="brand-mockup-avatar">AI</div>
                  <div>
                    <div className="brand-mockup-name">Agent Enrichment Flow</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Trigger: New account created</div>
                  </div>
                </div>
                <div className="brand-mockup-status">
                  <span className="brand-mockup-status-dot" />
                  <span>Active</span>
                </div>
              </div>

              <div className="brand-mockup-table">
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Verified Work Email</span>
                  <span className="brand-mockup-col-badge">100% Match</span>
                </div>
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Headcount & Revenue</span>
                  <span className="brand-mockup-col-badge">Enriched</span>
                </div>
                <div className="brand-mockup-row">
                  <span className="brand-mockup-col-primary">Installed Tech Stack</span>
                  <span className="brand-mockup-col-badge">12 Detected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial snippet */}
          <div className="brand-testimonial-card">
            <p className="brand-testimonial-text">
              "We automated our outbound pipeline in one afternoon. The data quality and enrichment speed is completely unmatched."
            </p>
            <div className="brand-testimonial-author">
              <div className="brand-author-avatar">SL</div>
              <div className="brand-author-meta">
                <span className="brand-author-name">Sarah Lin</span>
                <span className="brand-author-role">Head of Growth, ScaleGrid</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Warm Cream Footer */}
      <footer className="brand-footer">
        <div>© 2026 Bla Platform, Inc. All rights reserved.</div>
        <div className="brand-footer-links">
          <Link to="/privacy" className="brand-footer-link">Privacy Policy</Link>
          <Link to="/terms" className="brand-footer-link">Terms of Service</Link>
          <Link to="/security" className="brand-footer-link">Security</Link>
        </div>
      </footer>
    </div>
  )
}

export default ModernLoginPage
