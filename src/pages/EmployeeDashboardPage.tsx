import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User, ExpenseRequest, SystemNotification } from '../types'
import storageService from '../services/storageService'
import { useAuth } from '../context/AuthContext'
import { ExpenseModal } from '../components/ExpenseModal'
import { ReceiptViewerModal } from '../components/ReceiptViewerModal'
import '../styles/design-tokens.css'

interface EmployeeDashboardPageProps {
  currentUser: User
}

export const EmployeeDashboardPage: React.FC<EmployeeDashboardPageProps> = ({ currentUser }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [activeTab, setActiveTab] = useState<'claims' | 'notifications'>('claims')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([])
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [actionAlert, setActionAlert] = useState<string | null>(null)

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [receiptViewer, setReceiptViewer] = useState<{
    isOpen: boolean
    url: string
    name: string
    title: string
    amount?: number
    employeeName?: string
  }>({
    isOpen: false,
    url: '',
    name: '',
    title: '',
  })

  const loadData = () => {
    setExpenses(storageService.getExpensesByUser(currentUser.email))
    setNotifications(storageService.getNotifications(currentUser.email, currentUser.role))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const handleOpenReceipt = (url: string, name: string, title: string, amount?: number) => {
    setReceiptViewer({
      isOpen: true,
      url,
      name,
      title,
      amount,
      employeeName: currentUser.name,
    })
  }

  const handleSelectTab = (tab: 'claims' | 'notifications') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  // Filtered claims
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.expenseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.motive.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterStatus === 'all') return true
    return e.status === filterStatus
  })

  // Calculations
  const pendingCount = expenses.filter((e) => e.status === 'pending').length
  const approvedTotal = expenses
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalClaimed = expenses.reduce((sum, e) => sum + e.amount, 0)
  const unreadNotifs = notifications.filter((n) => !n.read).length

  return (
    <div className="brand-page-wrapper">
      {/* Top Navigation */}
      <header className="brand-nav">
        <div className="brand-nav-left">
          <Link to="/dashboard" className="brand-logo-mark">
            <div className="brand-logo-icon">B</div>
            <span className="brand-logo-text">Bla Expense Hub</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="brand-nav-links">
            <button
              type="button"
              className={`brand-nav-link ${activeTab === 'claims' ? 'active' : ''}`}
              onClick={() => handleSelectTab('claims')}
            >
              My Claims ({expenses.length})
            </button>
            <button
              type="button"
              className={`brand-nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleSelectTab('notifications')}
            >
              Alerts {unreadNotifs > 0 && <span className="brand-badge-counter">{unreadNotifs}</span>}
            </button>
          </nav>
        </div>

        <div className="brand-nav-actions">
          <button
            type="button"
            className="brand-btn-cobalt brand-btn-sm"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            + Request Expense
          </button>

          <div className="brand-user-role-badge">
            <span className="brand-status-dot" style={{ color: 'var(--state-success)' }} />
            <span>Staff: {currentUser.name}</span>
          </div>

          <button
            type="button"
            className="brand-btn-secondary brand-btn-sm"
            onClick={handleSignOut}
          >
            Sign out
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="brand-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="brand-mobile-drawer">
            <div className="brand-mobile-nav-links">
              <button
                type="button"
                className={`brand-mobile-nav-link ${activeTab === 'claims' ? 'active' : ''}`}
                onClick={() => handleSelectTab('claims')}
              >
                <span>My Claims</span>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>{expenses.length}</span>
              </button>
              <button
                type="button"
                className={`brand-mobile-nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleSelectTab('notifications')}
              >
                <span>Disbursement Alerts</span>
                {unreadNotifs > 0 && <span className="brand-badge-counter">{unreadNotifs}</span>}
              </button>
            </div>

            <div className="brand-mobile-actions">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--charcoal)' }}>Staff User:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)' }}>{currentUser.name}</span>
              </div>
              <button
                type="button"
                className="brand-btn-cobalt brand-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setIsExpenseModalOpen(true)
                  setIsMobileMenuOpen(false)
                }}
              >
                + Submit New Claim
              </button>
              <button
                type="button"
                className="brand-btn-primary brand-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Dashboard Body */}
      <main className="brand-dashboard-body">
        {/* Action Alert */}
        {actionAlert && (
          <div className="brand-alert brand-alert-success" role="status">
            <span>●</span>&nbsp;{actionAlert}
          </div>
        )}

        {/* Hero Greeting Band */}
        <section className="brand-dash-hero">
          <div className="brand-dash-greeting">
            <div className="brand-auth-badge">
              <span>●</span> {currentUser.department?.toUpperCase() || 'OPERATIONS'} • REIMBURSEMENT PORTAL
            </div>
            <h1 className="brand-dash-title">Welcome, {currentUser.name}</h1>
            <p className="brand-dash-subtitle">
              Submit your business expenditures, attach supporting invoices, and track payment disbursements.
            </p>
          </div>

          <div className="brand-dash-actions">
            <button
              type="button"
              className="brand-btn-cobalt"
              style={{ width: 'auto', padding: '12px 28px' }}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              + Submit New Claim
            </button>
          </div>
        </section>

        {/* 4-Up Metrics Grid */}
        <section className="brand-metrics-grid">
          {/* Card 1 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Total Claimed</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">₹{totalClaimed.toLocaleString()}</div>
              <span className="brand-metric-trend">{expenses.length} Entries</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Pending Review</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">{pendingCount}</div>
              <span className="brand-metric-trend">Awaiting Audit</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Approved & Disbursed</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">₹{approvedTotal.toLocaleString()}</div>
              <span className="brand-metric-trend">Authorized</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Rejected Claims</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">
                {expenses.filter((e) => e.status === 'rejected').length}
              </div>
              <span className="brand-metric-trend">History</span>
            </div>
          </div>
        </section>

        {/* TAB 1: Claims History */}
        {activeTab === 'claims' && (
          <section className="brand-section-card">
            <div className="brand-section-header">
              <div className="brand-section-title-group">
                <h2 className="brand-section-title">My Submitted Applications</h2>
                <p className="brand-section-desc">
                  Verification status of submitted claims, invoice attachments, and administrator remarks.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  placeholder="Search my claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="brand-input"
                  style={{ height: '38px', minWidth: '180px', flex: '1 1 200px', fontSize: '14px' }}
                />

                <div className="brand-tabs-list" style={{ flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    className={`brand-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    All ({expenses.length})
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('approved')}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('rejected')}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="brand-table-wrapper">
              <table className="brand-data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Category & Motive</th>
                    <th>Claimed Amount</th>
                    <th>Invoice / Receipt</th>
                    <th>Status</th>
                    <th>Administrator Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--slate)' }}>
                        {expenses.length === 0
                          ? 'No expense applications filed yet. Click "+ Submit New Claim" above to file an expense.'
                          : 'No claims matching the selected filter/search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--ink-deep)' }}>
                            {new Date(exp.dateTime).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--steel)' }}>
                            {new Date(exp.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '300px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-deep)', display: 'block' }}>
                              {exp.expenseType}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.4' }}>
                              {exp.motive}
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '15px', color: 'var(--ink-deep)' }}>
                            ₹{exp.amount.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="brand-link"
                            onClick={() =>
                              handleOpenReceipt(
                                exp.receiptUrl,
                                exp.receiptName,
                                `${exp.expenseType} - ₹${exp.amount.toLocaleString()}`,
                                exp.amount
                              )
                            }
                          >
                            Inspect Receipt ↗
                          </button>
                        </td>
                        <td>
                          <span className={`brand-status-pill ${exp.status}`}>
                            <span className="brand-status-dot" />
                            {exp.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {exp.adminNote ? (
                            <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--charcoal)' }}>
                                [{exp.reviewedBy || 'Admin'}]:
                              </span>{' '}
                              "{exp.adminNote}"
                            </div>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'var(--steel)', fontStyle: 'italic' }}>
                              Awaiting administrator review
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: Notifications Feed */}
        {activeTab === 'notifications' && (
          <section className="brand-section-card">
            <div className="brand-section-header">
              <div className="brand-section-title-group">
                <h2 className="brand-section-title">Disbursement & Review Alerts</h2>
                <p className="brand-section-desc">
                  Status updates regarding approvals and payment disbursements.
                </p>
              </div>

              <button
                type="button"
                className="brand-btn-secondary brand-btn-sm"
                onClick={() => {
                  storageService.markAllNotificationsAsRead(currentUser.email, currentUser.role)
                  loadData()
                  setActionAlert('All alerts marked as read.')
                  setTimeout(() => setActionAlert(null), 3000)
                }}
              >
                Mark All Read
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--slate)' }}>
                  No active alerts. You will receive notifications here when your claims are approved or reviewed.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'var(--surface-soft)',
                      border: '1px solid var(--surface-hairline)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '14px', marginTop: '2px', color: 'var(--color-primary)' }}>●</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                          {n.title} {!n.read && <span style={{ color: 'var(--color-primary)', marginLeft: '6px' }}>[NEW]</span>}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--charcoal)', marginTop: '4px' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '4px' }}>
                          {new Date(n.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        currentUser={currentUser}
        onExpenseCreated={() => {
          loadData()
          setActionAlert('Expense application successfully submitted to administrators for review.')
          setTimeout(() => setActionAlert(null), 4000)
        }}
      />

      {/* Receipt Viewer */}
      <ReceiptViewerModal
        isOpen={receiptViewer.isOpen}
        onClose={() => setReceiptViewer((prev) => ({ ...prev, isOpen: false }))}
        receiptUrl={receiptViewer.url}
        receiptName={receiptViewer.name}
        title={receiptViewer.title}
        amount={receiptViewer.amount}
        employeeName={receiptViewer.employeeName}
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

export default EmployeeDashboardPage
