import React from 'react'
import '../styles/design-tokens.css'

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  receiptUrl: string
  receiptName: string
  title: string
  amount?: number
  employeeName?: string
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  receiptUrl,
  receiptName,
  title,
  amount,
  employeeName,
}) => {
  if (!isOpen) return null

  return (
    <div className="brand-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="brand-modal-card brand-modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-modal-header">
          <div>
            <div className="brand-auth-badge" style={{ marginBottom: '8px' }}>
              <span>●</span> Invoice Document Inspection
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              {title}
            </h2>
            {employeeName && (
              <p className="brand-section-desc">
                Submitted by <strong style={{ color: 'var(--ink-deep)' }}>{employeeName}</strong> {amount ? `• ₹${amount.toLocaleString()}` : ''}
              </p>
            )}
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

        <div className="brand-receipt-display-frame">
          {receiptUrl.startsWith('data:application/pdf') || receiptName.toLowerCase().endsWith('.pdf') ? (
            <div className="brand-pdf-preview-box">
              <div className="brand-pdf-icon">📄</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                {receiptName}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--slate)' }}>
                PDF Invoice Attachment • Stored Locally
              </p>
              {receiptUrl.startsWith('data:application/pdf') && (
                <iframe
                  src={receiptUrl}
                  title="PDF Receipt Document"
                  style={{
                    width: '100%',
                    height: '420px',
                    border: '1px solid var(--surface-hairline)',
                    borderRadius: 'var(--radius-lg)',
                    marginTop: '16px',
                  }}
                />
              )}
            </div>
          ) : (
            <img
              src={receiptUrl}
              alt={receiptName}
              className="brand-receipt-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>

        <div className="brand-modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--steel)' }}>
            Document: {receiptName}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="brand-btn-primary brand-btn-sm"
              onClick={onClose}
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptViewerModal
