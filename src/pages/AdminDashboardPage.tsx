import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User, ExpenseRequest, SystemNotification } from '../types'
import storageService from '../services/storageService'
import { useAuth } from '../context/AuthContext'
import { AddEmployeeModal } from '../components/AddEmployeeModal'
import { ReviewExpenseModal } from '../components/ReviewExpenseModal'
import { ReceiptViewerModal } from '../components/ReceiptViewerModal'
import '../styles/design-tokens.css'

interface AdminDashboardPageProps {
  currentUser: User
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ currentUser }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [activeTab, setActiveTab] = useState<'applications' | 'employees' | 'notifications'>('applications')
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [actionAlert, setActionAlert] = useState<string | null>(null)

  // Modals state
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null)
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
    setExpenses(storageService.getExpenses())
    setUsers(storageService.getUsers())
    setNotifications(storageService.getNotifications(currentUser.email, currentUser.role))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const handleOpenReceipt = (url: string, name: string, title: string, amount?: number, empName?: string) => {
    setReceiptViewer({
      isOpen: true,
      url,
      name,
      title,
      amount,
      employeeName: empName,
    })
  }

  const handleSelectTab = (tab: 'applications' | 'employees' | 'notifications') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  // Filtered Applications
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.expenseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.motive.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (appFilter === 'all') return true
    return e.status === appFilter
  })

  // Calculations
  const pendingCount = expenses.filter((e) => e.status === 'pending').length
  const totalApprovedAmount = expenses
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalEmployeesCount = users.filter((u) => u.role === 'employee').length
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
              className={`brand-nav-link ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => handleSelectTab('applications')}
            >
              Applications {pendingCount > 0 && <span className="brand-badge-counter">{pendingCount}</span>}
            </button>
            <button
              type="button"
              className={`brand-nav-link ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => handleSelectTab('employees')}
            >
              Employees ({totalEmployeesCount})
            </button>
            <button
              type="button"
              className={`brand-nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleSelectTab('notifications')}
            >
              Notifications {unreadNotifs > 0 && <span className="brand-badge-counter">{unreadNotifs}</span>}
            </button>
          </nav>
        </div>

        <div className="brand-nav-actions">
          <div className="brand-user-role-badge">
            <span className="brand-status-dot" style={{ color: 'var(--state-success)' }} />
            <span>Admin: {currentUser.name}</span>
          </div>

          <button
            type="button"
            className="brand-btn-secondary brand-btn-sm"
            onClick={() => storageService.exportCredentialsJson()}
            title="Download credentials JSON backup"
          >
            Export JSON
          </button>

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
                className={`brand-mobile-nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => handleSelectTab('applications')}
              >
                <span>Applications</span>
                {pendingCount > 0 && <span className="brand-badge-counter">{pendingCount}</span>}
              </button>
              <button
                type="button"
                className={`brand-mobile-nav-link ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => handleSelectTab('employees')}
              >
                <span>Employees Directory</span>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>{totalEmployeesCount}</span>
              </button>
              <button
                type="button"
                className={`brand-mobile-nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleSelectTab('notifications')}
              >
                <span>Notifications</span>
                {unreadNotifs > 0 && <span className="brand-badge-counter">{unreadNotifs}</span>}
              </button>
            </div>

            <div className="brand-mobile-actions">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--charcoal)' }}>Logged in as:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)' }}>{currentUser.name}</span>
              </div>
              <button
                type="button"
                className="brand-btn-secondary brand-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  storageService.exportCredentialsJson()
                  setIsMobileMenuOpen(false)
                }}
              >
                Export JSON Backup
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

      {/* Main Container */}
      <main className="brand-dashboard-body">
        {/* Action Alert Banner */}
        {actionAlert && (
          <div className="brand-alert brand-alert-success" role="status">
            <span>●</span>&nbsp;{actionAlert}
          </div>
        )}

        {/* Hero Greeting & Header */}
        <section className="brand-dash-hero">
          <div className="brand-dash-greeting">
            <div className="brand-auth-badge">
              <span>●</span> Executive Administration Panel
            </div>
            <h1 className="brand-dash-title">Expense Administration</h1>
            <p className="brand-dash-subtitle">
              Audit employee reimbursement requests, verify attached invoices, and approve payment disbursements.
            </p>
          </div>

          <div className="brand-dash-actions">
            <button
              type="button"
              className="brand-btn-cobalt brand-btn-sm"
              onClick={() => setIsAddEmpOpen(true)}
            >
              + Provision Employee
            </button>
          </div>
        </section>

        {/* 4-Up Metrics Grid */}
        <section className="brand-metrics-grid">
          {/* Card 1 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Pending Review</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">{pendingCount}</div>
              <span className="brand-metric-trend">{pendingCount > 0 ? 'Needs Audit' : 'Up to Date'}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Total Approved</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">₹{totalApprovedAmount.toLocaleString()}</div>
              <span className="brand-metric-trend">Authorized</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Staff Members</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">{totalEmployeesCount}</div>
              <span className="brand-metric-trend">Registered</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="brand-metric-card">
            <div className="brand-metric-top">
              <span className="brand-metric-label">Total Applications</span>
              <svg className="brand-metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="brand-metric-value-row">
              <div className="brand-metric-val">{expenses.length}</div>
              <span className="brand-metric-trend">Lifetime</span>
            </div>
          </div>
        </section>

        {/* TAB 1: Applications */}
        {activeTab === 'applications' && (
          <section className="brand-section-card">
            <div className="brand-section-header">
              <div className="brand-section-title-group">
                <h2 className="brand-section-title">Expense Applications</h2>
                <p className="brand-section-desc">
                  Inspect invoices, verify motives, and disburse reimbursements to staff members.
                </p>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="brand-input"
                  style={{ height: '38px', minWidth: '180px', flex: '1 1 200px', fontSize: '14px' }}
                />

                <div className="brand-tabs-list" style={{ flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    className={`brand-tab-btn ${appFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAppFilter('all')}
                  >
                    All ({expenses.length})
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${appFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setAppFilter('pending')}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${appFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setAppFilter('approved')}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    className={`brand-tab-btn ${appFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setAppFilter('rejected')}
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
                    <th>Employee & Date</th>
                    <th>Category & Motive</th>
                    <th>Amount</th>
                    <th>Invoice / Receipt</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--slate)' }}>
                        {expenses.length === 0
                          ? 'No expense applications submitted yet. Employee submissions will appear here in real-time.'
                          : 'No applications matching the selected search/filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>
                          <div className="brand-flow-info">
                            <div className="brand-flow-avatar">
                              {exp.employeeName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="brand-flow-meta">
                              <span className="brand-flow-title">{exp.employeeName}</span>
                              <span className="brand-flow-sub">
                                {exp.employeeEmail} • {new Date(exp.dateTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '280px' }}>
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
                                exp.amount,
                                exp.employeeName
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
                          {exp.adminNote && (
                            <div style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '4px' }}>
                              Note: {exp.adminNote}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="brand-btn-cobalt brand-btn-sm"
                            onClick={() => setSelectedExpense(exp)}
                          >
                            Review & Decide
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: Employees Directory */}
        {activeTab === 'employees' && (
          <section className="brand-section-card">
            <div className="brand-section-header">
              <div className="brand-section-title-group">
                <h2 className="brand-section-title">Staff Credentials Directory</h2>
                <p className="brand-section-desc">
                  Employees provisioned by administrators with designated login credentials.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="brand-btn-secondary brand-btn-sm"
                  onClick={() => storageService.exportCredentialsJson()}
                >
                  Export JSON Backup
                </button>
                <button
                  type="button"
                  className="brand-btn-cobalt brand-btn-sm"
                  onClick={() => setIsAddEmpOpen(true)}
                >
                  + Provision Employee
                </button>
              </div>
            </div>

            <div className="brand-table-wrapper">
              <table className="brand-data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Login Email (ID)</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Assigned Password</th>
                    <th>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="brand-flow-avatar">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ color: 'var(--ink-deep)', fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--charcoal)' }}>{u.email}</td>
                      <td>
                        <span className="brand-mockup-col-badge">
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{u.department || 'General Operations'}</td>
                      <td>
                        <code style={{ fontSize: '13px', color: 'var(--ink-deep)', backgroundColor: 'var(--surface-soft)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {u.password}
                        </code>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--steel)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: Notifications Feed */}
        {activeTab === 'notifications' && (
          <section className="brand-section-card">
            <div className="brand-section-header">
              <div className="brand-section-title-group">
                <h2 className="brand-section-title">Audit Log & Notifications</h2>
                <p className="brand-section-desc">
                  Real-time event stream of incoming expense claims and employee additions.
                </p>
              </div>

              <button
                type="button"
                className="brand-btn-secondary brand-btn-sm"
                onClick={() => {
                  storageService.markAllNotificationsAsRead(currentUser.email, currentUser.role)
                  loadData()
                  setActionAlert('All notifications marked as read.')
                  setTimeout(() => setActionAlert(null), 3000)
                }}
              >
                Mark All Read
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--slate)' }}>
                  No notifications recorded yet. Incoming expense claims will appear here.
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

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddEmpOpen}
        onClose={() => setIsAddEmpOpen(false)}
        onEmployeeAdded={() => {
          loadData()
          setActionAlert('New employee account provisioned in local store.')
          setTimeout(() => setActionAlert(null), 4000)
        }}
      />

      <ReviewExpenseModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        adminUser={currentUser}
        onUpdated={() => {
          loadData()
          setActionAlert('Disbursement decision finalized and employee alert dispatched.')
          setTimeout(() => setActionAlert(null), 4000)
        }}
        onViewReceipt={handleOpenReceipt}
      />

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

export default AdminDashboardPage
