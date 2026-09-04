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
  | 'direct_message'
  | 'daily_update'
  | 'meeting_call'
  | 'user_mention'

export interface SystemNotification {
  id: string
  recipientEmail: string // 'admin' or specific employee email
  title: string
  message: string
  type: NotificationType
  timestamp: string
  read: boolean
  linkId?: string
  senderName?: string
}

export interface DirectMessage {
  id: string
  senderId: string
  senderName: string
  senderEmail: string
  recipientId: string
  recipientName: string
  recipientEmail: string
  content: string
  timestamp: string
  read: boolean
}

export type DailyUpdateTag =
  | "Today's Focus"
  | 'Completed'
  | 'Blocker'
  | 'General Update'

export interface DailyUpdate {
  id: string
  authorId: string
  authorName: string
  authorEmail: string
  authorRole: UserRole
  authorDepartment: string
  tag: DailyUpdateTag
  content: string
  timestamp: string
  likes: string[] // User emails who acknowledged
  mentions?: string[] // User emails tagged via @
}

export type MeetingPlatform = 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Other'

export interface AdminCall {
  id: string
  hostId: string
  hostName: string
  hostEmail: string
  hostRole: UserRole
  title: string
  description: string
  meetingUrl: string
  platform: MeetingPlatform
  scheduledTime: string
  status: 'active' | 'scheduled' | 'ended'
  createdAt: string
  endedAt?: string
  endedBy?: string
  momNote?: string // Minutes of Meeting note
  mentions?: string[]
}

export interface LocalStoreData {
  version?: string
  users: User[]
  expenses: ExpenseRequest[]
  notifications: SystemNotification[]
  directMessages: DirectMessage[]
  dailyUpdates: DailyUpdate[]
  adminCalls: AdminCall[]
}
