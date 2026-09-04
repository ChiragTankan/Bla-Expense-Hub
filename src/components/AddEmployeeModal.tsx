import React, { useState } from 'react'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onEmployeeAdded: () => void
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onEmployeeAdded,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('emp123')
  const [department, setDepartment] = useState('Sales & Marketing')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let generated = ''
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(generated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all employee account fields.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await storageService.createEmployee(name, email, password, department)
      setIsSubmitting(false)

      if (!res.success) {
        setError(res.error || 'Failed to create employee account.')
        return
      }

      onEmployeeAdded()
      onClose()
    } catch {
      setIsSubmitting(false)
      setError('An error occurred while creating employee account.')
    }
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
              <span>●</span> Staff Provisioning
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              Onboard New Employee
            </h2>
            <p className="brand-section-desc">
              Create an employee account with designated login credentials.
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
          <div className="brand-field">
            <label htmlFor="add-emp-name" className="brand-label">
              Employee Full Name *
            </label>
            <input
              id="add-emp-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="brand-input"
            />
          </div>

          <div className="brand-field">
            <label htmlFor="add-emp-email" className="brand-label">
              Login Email Address (User ID) *
            </label>
            <input
              id="add-emp-email"
              name="email"
              type="email"
              required
              placeholder="e.g. priya@enterprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brand-input"
            />
          </div>

          <div className="brand-form-grid-2">
            <div className="brand-field">
              <div className="brand-label-row">
                <label htmlFor="add-emp-pass" className="brand-label">
                  Assigned Password *
                </label>
                <button
                  type="button"
                  className="brand-link"
                  style={{ fontSize: '12px' }}
                  onClick={handleGeneratePassword}
                >
                  Generate
                </button>
              </div>
              <input
                id="add-emp-pass"
                name="password"
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="brand-input"
              />
            </div>

            <div className="brand-field">
              <label htmlFor="add-emp-dept" className="brand-label">
                Department
              </label>
              <select
                id="add-emp-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="brand-select"
              >
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Engineering & Tech">Engineering & Tech</option>
                <option value="Operations & Admin">Operations & Admin</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
          </div>

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
              {isSubmitting ? 'Provisioning...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployeeModal
