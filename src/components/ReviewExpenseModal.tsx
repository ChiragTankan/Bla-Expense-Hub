import React, { useState } from 'react'
import type { ExpenseRequest, User } from '../types'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface ReviewExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseRequest | null
  adminUser: User
  onUpdated: () => void
  onViewReceipt: (url: string, name: string, title: string, amount?: number, empName?: string) => void
}

export const ReviewExpenseModal: React.FC<ReviewExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  adminUser,
  onUpdated,
  onViewReceipt,
}) => {
  const [adminNote, setAdminNote] = useState('Authorized for direct bank transfer disbursement.')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !expense) return null

  const handleAction = (status: 'approved' | 'rejected') => {
    setIsProcessing(true)
    setTimeout(() => {
      storageService.updateExpenseStatus(expense.id, status, adminNote, adminUser.name)
      setIsProcessing(false)
      onUpdated()
      onClose()
    }, 350)
  }

  return (
    <div className="brand-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="brand-modal-card brand-modal-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-modal-header">
          <div>
            <div className="brand-auth-badge" style={{ marginBottom: '8px' }}>
              <span>●</span> Expenditure Audit
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              Claim Review: ₹{expense.amount.toLocaleString()}
            </h2>
            <p className="brand-section-desc">
              Submitted by <strong style={{ color: 'var(--ink-deep)' }}>{expense.employeeName}</strong> ({expense.employeeEmail})
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

        {/* Claim Spec Table */}
        <div className="brand-product-mockup">
          <div className="brand-mockup-table">
            <div className="brand-mockup-row">
              <span className="brand-mockup-col-primary">Category</span>
              <span style={{ color: 'var(--ink-deep)', fontWeight: 600 }}>{expense.expenseType}</span>
            </div>
            <div className="brand-mockup-row">
              <span className="brand-mockup-col-primary">Transaction Date</span>
              <span>{new Date(expense.dateTime).toLocaleString()}</span>
            </div>
            <div className="brand-mockup-row">
              <span className="brand-mockup-col-primary">Claimed Amount</span>
              <strong style={{ fontSize: '16px', color: 'var(--ink-deep)' }}>
                ₹{expense.amount.toLocaleString()}
              </strong>
            </div>
            <div className="brand-mockup-row">
              <span className="brand-mockup-col-primary">Current Status</span>
              <span className={`brand-status-pill ${expense.status}`}>
                <span className="brand-status-dot" />
                {expense.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Motive Details */}
        <div className="brand-field">
          <label className="brand-label">Business Motive & Details</label>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--surface-soft)',
              border: '1px solid var(--surface-hairline)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--ink-deep)',
            }}
          >
            {expense.motive}
          </div>
        </div>

        {/* Receipt Attachment Link */}
        <div className="brand-field">
          <label className="brand-label">Invoice / Receipt Document</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--surface-canvas)',
              border: '1px solid var(--surface-hairline)',
              borderRadius: 'var(--radius-lg)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📄</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-deep)', fontWeight: 600 }}>
                {expense.receiptName}
              </span>
            </div>
            <button
              type="button"
              className="brand-link"
              onClick={() =>
                onViewReceipt(
                  expense.receiptUrl,
                  expense.receiptName,
                  `${expense.expenseType} - ₹${expense.amount.toLocaleString()}`,
                  expense.amount,
                  expense.employeeName
                )
              }
            >
              Inspect Attachment ↗
            </button>
          </div>
        </div>

        {/* Admin Decision / Disbursement Note */}
        <div className="brand-field">
          <label htmlFor="review-note" className="brand-label">
            Administrator Remarks / Disbursement Note
          </label>
          <input
            id="review-note"
            type="text"
            className="brand-input"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Authorized. Direct bank transfer initiated."
          />
        </div>

        {/* Modal Actions */}
        <div className="brand-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="brand-btn-secondary brand-btn-sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="brand-btn-secondary brand-btn-sm"
              style={{ borderColor: 'var(--state-critical)', color: 'var(--state-critical)' }}
              onClick={() => handleAction('rejected')}
              disabled={isProcessing}
            >
              Reject Claim
            </button>
            <button
              type="button"
              className="brand-btn-cobalt brand-btn-sm"
              onClick={() => handleAction('approved')}
              disabled={isProcessing}
            >
              {isProcessing ? 'Authorizing...' : 'Approve & Disburse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewExpenseModal
