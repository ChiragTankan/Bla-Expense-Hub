import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/design-tokens.css'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="brand-page-wrapper" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
      <div className="brand-section-card" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '48px 36px', borderRadius: 'var(--radius-xxxl)' }}>
        <div className="brand-auth-badge" style={{ justifyContent: 'center', marginBottom: '16px' }}>
          <span>●</span> 404 Status
        </div>
        <h1 className="brand-auth-title" style={{ fontSize: '32px', marginBottom: '12px' }}>
          Page Not Located
        </h1>
        <p className="brand-auth-subtitle" style={{ marginBottom: '32px' }}>
          The requested system resource or page does not exist or has been relocated.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="brand-btn-primary" style={{ width: 'auto', padding: '14px 28px' }}>
            Return to Login
          </Link>
          <Link to="/dashboard" className="brand-btn-secondary" style={{ width: 'auto', padding: '12px 28px' }}>
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
