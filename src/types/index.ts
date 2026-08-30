export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  department?: string
  createdAt: string
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export type ExpenseCategory =
  | 'Travel & Commute (Uber/Taxi)'
  | 'Meals & Client Entertainment'
  | 'Office Supplies & Equipment'
  | 'Software & SaaS Tools'
  | 'Hotel & Lodging'
  | 'Other Business Expense'

export interface ExpenseRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  amount: number
  currency: string
  expenseType: ExpenseCategory
  dateTime: string
  motive: string
  receiptUrl: string
  receiptName: string
  status: ExpenseStatus
  adminNote?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export type NotificationType =
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'employee_created'

export interface SystemNotification {
  id: string
  recipientEmail: string // 'admin' or specific employee email
  title: string
  message: string
  type: NotificationType
  timestamp: string
  read: boolean
  linkId?: string
}

export interface LocalStoreData {
  version?: string
  users: User[]
  expenses: ExpenseRequest[]
  notifications: SystemNotification[]
}
