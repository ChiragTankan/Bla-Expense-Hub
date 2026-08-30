import type { User, ExpenseRequest, SystemNotification, LocalStoreData, ExpenseCategory } from '../types'
import initialData from '../data/initialStore.json'

const STORAGE_KEY = 'bla_expense_hub_store_v2'
const SESSION_KEY = 'bla_active_session_user_v2'

class StorageService {
  private getStore(): LocalStoreData {
    try {
      const item = localStorage.getItem(STORAGE_KEY)
      if (!item) {
        this.saveStore(initialData as LocalStoreData)
        return initialData as LocalStoreData
      }
      const parsed = JSON.parse(item) as LocalStoreData
      // Migrate if version mismatch
      if (!parsed.version || parsed.version !== '2.0.0') {
        this.saveStore(initialData as LocalStoreData)
        return initialData as LocalStoreData
      }
      return parsed
    } catch {
      return initialData as LocalStoreData
    }
  }

  private saveStore(data: LocalStoreData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save to local store:', e)
    }
  }

  // ================= User & Auth =================
  public getUsers(): User[] {
    return this.getStore().users
  }

  public getUserByEmail(email: string): User | undefined {
    return this.getStore().users.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    )
  }

  public login(email: string, pass: string): User | null {
    const user = this.getUserByEmail(email)
    if (!user) return null
    if (user.password !== pass) return null
    this.setActiveSessionUser(user)
    return user
  }

  public getActiveSessionUser(): User | null {
    try {
      const item = localStorage.getItem(SESSION_KEY)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  public setActiveSessionUser(user: User | null): void {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  public createEmployee(
    name: string,
    email: string,
    password: string,
    department?: string
  ): { success: boolean; user?: User; error?: string } {
    const store = this.getStore()
    const cleanEmail = email.toLowerCase().trim()

    if (store.users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' }
    }

    const newUser: User = {
      id: `usr-emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'employee',
      password: password.trim(),
      department: department?.trim() || 'General Operations',
      createdAt: new Date().toISOString(),
    }

    store.users.push(newUser)

    // Notify admins about the new employee addition
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientEmail: 'admin',
      type: 'employee_created',
      title: 'New Employee Registered',
      message: `${newUser.name} (${newUser.email}) was provisioned for ${newUser.department}.`,
      timestamp: new Date().toISOString(),
      read: false,
    })

    this.saveStore(store)
    return { success: true, user: newUser }
  }

  // ================= Expenses =================
  public getExpenses(): ExpenseRequest[] {
    return this.getStore().expenses
  }

  public getExpensesByUser(userEmail: string): ExpenseRequest[] {
    const clean = userEmail.toLowerCase().trim()
    return this.getStore().expenses.filter(
      (e) => e.employeeEmail.toLowerCase().trim() === clean
    )
  }

  public createExpense(data: {
    employeeId: string
    employeeName: string
    employeeEmail: string
    amount: number
    currency?: string
    expenseType: ExpenseCategory
    dateTime: string
    motive: string
    receiptUrl: string
    receiptName: string
  }): ExpenseRequest {
    const store = this.getStore()
    const now = new Date().toISOString()
    const newExpense: ExpenseRequest = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail.toLowerCase().trim(),
      amount: data.amount,
      currency: data.currency || 'INR',
      expenseType: data.expenseType,
      dateTime: data.dateTime,
      motive: data.motive,
      receiptUrl: data.receiptUrl,
      receiptName: data.receiptName,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    store.expenses.unshift(newExpense)

    // Notify Admins in real-time
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientEmail: 'admin',
      type: 'expense_submitted',
      title: 'New Expense Claim Submitted',
      message: `${data.employeeName} submitted a claim of ₹${data.amount.toLocaleString()} for ${data.expenseType}.`,
      timestamp: now,
      read: false,
      linkId: newExpense.id,
    })

    this.saveStore(store)
    return newExpense
  }

  public updateExpenseStatus(
    expenseId: string,
    status: 'approved' | 'rejected',
    adminNote?: string,
    adminName?: string
  ): ExpenseRequest | null {
    const store = this.getStore()
    const index = store.expenses.findIndex((e) => e.id === expenseId)
    if (index === -1) return null

    const expense = store.expenses[index]
    const now = new Date().toISOString()
    expense.status = status
    expense.adminNote = adminNote
    expense.reviewedBy = adminName || 'System Admin'
    expense.reviewedAt = now
    expense.updatedAt = now

    store.expenses[index] = expense

    // Send targeted confirmation notification to the employee
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientEmail: expense.employeeEmail,
      type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
      title: status === 'approved' ? 'Expense Claim Approved & Disbursed' : 'Expense Claim Rejected',
      message:
        status === 'approved'
          ? `Your claim for ₹${expense.amount.toLocaleString()} (${expense.expenseType}) was approved by ${adminName || 'Admin'}. Disbursement remark: "${adminNote || 'Processed'}"`
          : `Your claim for ₹${expense.amount.toLocaleString()} (${expense.expenseType}) was rejected. Reason: "${adminNote || 'No reason specified'}"`,
      timestamp: now,
      read: false,
      linkId: expense.id,
    })

    this.saveStore(store)
    return expense
  }

  // ================= Notifications =================
  public getNotifications(userEmail: string, role: 'admin' | 'employee'): SystemNotification[] {
    const store = this.getStore()
    const cleanEmail = userEmail.toLowerCase().trim()
    return store.notifications.filter((n) => {
      if (role === 'admin') {
        return n.recipientEmail === 'admin'
      }
      return n.recipientEmail.toLowerCase().trim() === cleanEmail
    })
  }

  public markAllNotificationsAsRead(userEmail: string, role: 'admin' | 'employee'): void {
    const store = this.getStore()
    const cleanEmail = userEmail.toLowerCase().trim()
    store.notifications = store.notifications.map((n) => {
      if (role === 'admin' && n.recipientEmail === 'admin') {
        return { ...n, read: true }
      }
      if (role === 'employee' && n.recipientEmail.toLowerCase().trim() === cleanEmail) {
        return { ...n, read: true }
      }
      return n
    })
    this.saveStore(store)
  }

  // ================= Backup & Export =================
  public exportCredentialsJson(): void {
    const store = this.getStore()
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enterprise_credentials_store_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const storageService = new StorageService()
export default storageService
