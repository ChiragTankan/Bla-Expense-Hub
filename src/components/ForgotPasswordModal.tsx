import React from 'react'
import '../styles/design-tokens.css'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="brand-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="brand-modal-card brand-modal-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-modal-header">
          <div>
            <div className="brand-auth-badge" style={{ marginBottom: '8px' }}>
              <span>●</span> Centralized Access Control
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              Password Reset Notice
            </h2>
            <p className="brand-section-desc">
              Employee authentication credentials are provisioned centrally by administrators.
            </p>
          </div>
          <button
            type="button"
            className="brand-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Notice Content */}
        <div
          style={{
            backgroundColor: 'var(--surface-soft)',
            border: '1px solid var(--surface-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--ink-deep)' }}>
            For enterprise security and governance compliance, self-service password reset is disabled. If you have forgotten your password or need a credential update, please contact an authorized administrator:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="brand-mockup-row" style={{ backgroundColor: 'var(--surface-canvas)' }}>
              <span className="brand-mockup-col-primary">Chirag Tankan</span>
              <span className="brand-mockup-col-badge">chiragtankan@gmail.com</span>
            </div>
            <div className="brand-mockup-row" style={{ backgroundColor: 'var(--surface-canvas)' }}>
              <span className="brand-mockup-col-primary">Pardeep Sir</span>
              <span className="brand-mockup-col-badge">pardeep@enterprise.com</span>
            </div>
            <div className="brand-mockup-row" style={{ backgroundColor: 'var(--surface-canvas)' }}>
              <span className="brand-mockup-col-primary">Mayank</span>
              <span className="brand-mockup-col-badge">mayank@enterprise.com</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--slate)' }}>
            Administrators can update and re-issue your credentials directly through the Staff Management console.
          </p>
        </div>

        <div className="brand-modal-footer">
          <button
            type="button"
            className="brand-btn-cobalt brand-btn-sm"
            onClick={onClose}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
