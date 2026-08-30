import React, { useState } from 'react'
import type { User, ExpenseCategory } from '../types'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  onExpenseCreated: () => void
}

const CATEGORIES: ExpenseCategory[] = [
  'Travel & Commute (Uber/Taxi)',
  'Meals & Client Entertainment',
  'Office Supplies & Equipment',
  'Software & SaaS Tools',
  'Hotel & Lodging',
  'Other Business Expense',
]

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onExpenseCreated,
}) => {
  const [expenseType, setExpenseType] = useState<ExpenseCategory>('Travel & Commute (Uber/Taxi)')
  const [amount, setAmount] = useState<string>('')
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offset).toISOString().slice(0, 16)
  })
  const [motive, setMotive] = useState<string>('')
  const [receiptName, setReceiptName] = useState<string>('')
  const [receiptUrl, setReceiptUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Selected file exceeds the 8MB size limit.')
        return
      }
      setError(null)
      setReceiptName(file.name)
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReceiptUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please specify a valid monetary amount greater than 0.')
      return
    }

    if (!motive.trim()) {
      setError('Please provide a business motive describing this expenditure.')
      return
    }

    if (!receiptUrl || !receiptName) {
      setError('An itemized receipt document (Image or PDF) must be attached.')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      storageService.createExpense({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        employeeEmail: currentUser.email,
        amount: numAmount,
        currency: 'INR',
        expenseType,
        dateTime,
        motive: motive.trim(),
        receiptUrl,
        receiptName,
      })

      setIsSubmitting(false)
      onExpenseCreated()
      onClose()
    }, 400)
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
              <span>●</span> Reimbursement Filing
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              Submit Expense Application
            </h2>
            <p className="brand-section-desc">
              Provide invoice details and upload supporting receipts for administrator review.
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

        {error && (
          <div className="brand-alert brand-alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="brand-form" onSubmit={handleSubmit} noValidate>
          {/* Amount & Category */}
          <div className="brand-form-grid-2">
            <div className="brand-field">
              <label htmlFor="expense-amount" className="brand-label">
                Claim Amount (INR ₹) *
              </label>
              <div className="brand-input-box">
                <input
                  id="expense-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="brand-input"
                />
              </div>
            </div>

            <div className="brand-field">
              <label htmlFor="expense-category" className="brand-label">
                Expenditure Category *
              </label>
              <select
                id="expense-category"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as ExpenseCategory)}
                className="brand-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="brand-field">
            <label htmlFor="expense-datetime" className="brand-label">
              Transaction Date & Time *
            </label>
            <input
              id="expense-datetime"
              name="dateTime"
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="brand-input"
            />
          </div>

          {/* Motive / Description */}
          <div className="brand-field">
            <label htmlFor="expense-motive" className="brand-label">
              Business Motive & Description *
            </label>
            <textarea
              id="expense-motive"
              name="motive"
              rows={3}
              required
              placeholder="e.g. Travel to client site for quarterly review meeting..."
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              className="brand-textarea"
            />
          </div>

          {/* Receipt Upload */}
          <div className="brand-field">
            <label className="brand-label">
              Attach Invoice / Receipt (Image or PDF) *
            </label>
            
            <div className="brand-upload-zone">
              <input
                type="file"
                id="receipt-file-input"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="receipt-file-input" className="brand-upload-droparea">
                <div className="brand-upload-icon">📁</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                  Click to Upload Receipt or Invoice
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
                  Supports PNG, JPG, JPEG, and PDF documents (Max 8MB)
                </div>
              </label>

              {receiptName && (
                <div className="brand-receipt-selected-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📄</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-deep)' }}>
                      {receiptName}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="brand-link"
                    onClick={() => {
                      setReceiptName('')
                      setReceiptUrl('')
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Live Upload Preview */}
            {receiptUrl && !receiptName.endsWith('.pdf') && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img
                  src={receiptUrl}
                  alt="Receipt Preview"
                  style={{
                    maxHeight: '160px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-hairline)',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="brand-modal-footer">
            <button
              type="button"
              className="brand-btn-secondary brand-btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="brand-btn-cobalt brand-btn-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Transmitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExpenseModal
