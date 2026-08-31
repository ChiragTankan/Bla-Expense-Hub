import type {
  User,
  ExpenseRequest,
  SystemNotification,
  LocalStoreData,
  ExpenseCategory,
  DirectMessage,
  DailyUpdate,
  DailyUpdateTag,
  AdminCall,
  MeetingPlatform,
} from '../types'
import initialData from '../data/initialStore.json'
import { supabaseClient, SUPABASE_CONFIG } from './supabaseClient'

const STORAGE_KEY = 'bla_expense_hub_cloud_v3'
const SESSION_KEY = 'bla_active_session_user_v3'

// BroadcastChannel for instant real-time multi-tab & cross-window reactivity
let realtimeChannel: BroadcastChannel | null = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel('bla_cloud_realtime_v3')
  }
} catch (err) {
  console.warn('BroadcastChannel not supported in this environment:', err)
}

type RealtimeListener = (event: { type: string; payload?: unknown }) => void

class StorageService {
  private listeners: Set<RealtimeListener> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen to cross-tab broadcast events
      if (realtimeChannel) {
        realtimeChannel.onmessage = (event) => {
          this.notifySubscribers(event.data)
        }
      }

      // Fallback cross-tab storage event
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notifySubscribers({ type: 'STORE_UPDATED' })
        }
      })
    }
  }

  // ================= Real-time Event System =================
  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifySubscribers(event: { type: string; payload?: unknown }): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (err) {
        console.error('Error in realtime listener:', err)
      }
    })
  }

  private broadcast(event: { type: string; payload?: unknown }): void {
    this.notifySubscribers(event)
    if (realtimeChannel) {
      try {
        realtimeChannel.postMessage(event)
      } catch (err) {
        console.error('Error posting to realtime channel:', err)
      }
    }
  }

  // ================= Supabase Info =================
  public getSupabaseInfo() {
    return {
      connected: true,
      url: SUPABASE_CONFIG.url,
      client: supabaseClient,
    }
  }

  // ================= Store Persistence =================
  private getStore(): LocalStoreData {
    try {
      const item = localStorage.getItem(STORAGE_KEY)
      if (!item) {
        this.saveStore(initialData as LocalStoreData, false)
        return initialData as LocalStoreData
      }
      const parsed = JSON.parse(item) as LocalStoreData
      if (!parsed.version || parsed.version !== '3.0.0') {
        const updated: LocalStoreData = {
          version: '3.0.0',
          users: parsed.users && parsed.users.length > 0 ? parsed.users : (initialData.users as User[]),
          expenses: parsed.expenses || [],
          notifications: parsed.notifications || [],
          directMessages: parsed.directMessages || [],
          dailyUpdates: parsed.dailyUpdates || [],
          adminCalls: parsed.adminCalls || [],
        }
        this.saveStore(updated, false)
        return updated
      }
      return parsed
    } catch {
      return initialData as LocalStoreData
    }
  }

  private saveStore(data: LocalStoreData, shouldBroadcast = true): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (shouldBroadcast) {
        this.broadcast({ type: 'STORE_MUTATED' })
      }
    } catch (e) {
      console.error('Failed to save to cloud store:', e)
    }
  }

  // ================= @Mentions Processor =================
  private detectAndNotifyMentions(
    content: string,
    sender: User,
    contextTitle: string,
    linkId?: string
  ): void {
    const store = this.getStore()
    const allUsers = store.users

    // Match patterns like @username, @name, @email, or @Firstname
    const mentionRegex = /@([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)?)/g
    const matches = Array.from(content.matchAll(mentionRegex))

    const mentionedEmails = new Set<string>()

    matches.forEach((match) => {
      const tagText = match[1].toLowerCase().trim()
      allUsers.forEach((u) => {
        if (u.email.toLowerCase() === sender.email.toLowerCase()) return // don't notify self

        const matchEmail = u.email.toLowerCase().includes(tagText)
        const matchName = u.name.toLowerCase().includes(tagText)
        const matchFirstWord = u.name.toLowerCase().split(' ')[0] === tagText

        if (matchEmail || matchName || matchFirstWord) {
          mentionedEmails.add(u.email.toLowerCase())
        }
      })
    })

    // Dispatch special mention alerts
    mentionedEmails.forEach((email) => {
      store.notifications.unshift({
        id: `notif-mention-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: email,
        type: 'user_mention',
        title: `🔔 Mentioned by ${sender.name}`,
        message: `${sender.name} tagged you in ${contextTitle}: "${content.length > 80 ? content.slice(0, 80) + '...' : content}"`,
        timestamp: new Date().toISOString(),
        read: false,
        linkId,
        senderName: sender.name,
      })
    })

    if (mentionedEmails.size > 0) {
      this.saveStore(store, true)
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
    this.broadcast({ type: 'SESSION_CHANGED', payload: user })
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

  // ================= Direct Messages (1-on-1) =================
  public getDirectMessages(user1Email: string, user2Email: string): DirectMessage[] {
    const store = this.getStore()
    const e1 = user1Email.toLowerCase().trim()
    const e2 = user2Email.toLowerCase().trim()

    return (store.directMessages || []).filter(
      (m) =>
        (m.senderEmail.toLowerCase() === e1 && m.recipientEmail.toLowerCase() === e2) ||
        (m.senderEmail.toLowerCase() === e2 && m.recipientEmail.toLowerCase() === e1)
    )
  }

  public sendDirectMessage(
    sender: User,
    recipient: User,
    content: string
  ): DirectMessage {
    const store = this.getStore()
    if (!store.directMessages) store.directMessages = []

    const newDM: DirectMessage = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email.toLowerCase().trim(),
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email.toLowerCase().trim(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    }

    store.directMessages.push(newDM)

    // Create a real-time notification for recipient
    store.notifications.unshift({
      id: `notif-dm-${Date.now()}`,
      recipientEmail: recipient.email.toLowerCase().trim(),
      type: 'direct_message',
      title: `Message from ${sender.name}`,
      message: `${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
      timestamp: newDM.timestamp,
      read: false,
      linkId: sender.email,
      senderName: sender.name,
    })

    this.saveStore(store)

    // Check for @mentions in DM
    this.detectAndNotifyMentions(content, sender, `Direct Message with ${sender.name}`)

    this.broadcast({ type: 'NEW_DIRECT_MESSAGE', payload: newDM })
    return newDM
  }

  public getUnreadDMCountForUser(userEmail: string, otherUserEmail?: string): number {
    const store = this.getStore()
    const cleanUser = userEmail.toLowerCase().trim()
    const dms = store.directMessages || []

    if (otherUserEmail) {
      const cleanOther = otherUserEmail.toLowerCase().trim()
      return dms.filter(
        (m) =>
          m.recipientEmail.toLowerCase() === cleanUser &&
          m.senderEmail.toLowerCase() === cleanOther &&
          !m.read
      ).length
    }

    return dms.filter((m) => m.recipientEmail.toLowerCase() === cleanUser && !m.read).length
  }

  public markDMsAsRead(recipientEmail: string, senderEmail: string): void {
    const store = this.getStore()
    const rEmail = recipientEmail.toLowerCase().trim()
    const sEmail = senderEmail.toLowerCase().trim()

    let changed = false
    store.directMessages = (store.directMessages || []).map((m) => {
      if (
        m.recipientEmail.toLowerCase() === rEmail &&
        m.senderEmail.toLowerCase() === sEmail &&
        !m.read
      ) {
        changed = true
        return { ...m, read: true }
      }
      return m
    })

    if (changed) {
      this.saveStore(store)
    }
  }

  // ================= Daily Updates (Company Group Chat) =================
  public getDailyUpdates(): DailyUpdate[] {
    const store = this.getStore()
    return (store.dailyUpdates || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  public postDailyUpdate(
    author: User,
    tag: DailyUpdateTag,
    content: string
  ): DailyUpdate {
    const store = this.getStore()
    if (!store.dailyUpdates) store.dailyUpdates = []

    const now = new Date().toISOString()
    const newUpdate: DailyUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: author.id,
      authorName: author.name,
      authorEmail: author.email.toLowerCase().trim(),
      authorRole: author.role,
      authorDepartment: author.department || 'Operations',
      tag,
      content: content.trim(),
      timestamp: now,
      likes: [],
    }

    store.dailyUpdates.unshift(newUpdate)

    // Broadcast notification to all other users
    const otherUsers = store.users.filter(
      (u) => u.email.toLowerCase() !== author.email.toLowerCase()
    )
    otherUsers.forEach((u) => {
      store.notifications.unshift({
        id: `notif-update-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: u.email.toLowerCase(),
        type: 'daily_update',
        title: `Daily Update from ${author.name}`,
        message: `[${tag}] ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
        timestamp: now,
        read: false,
        linkId: newUpdate.id,
        senderName: author.name,
      })
    })

    this.saveStore(store)

    // Process @mentions in daily update
    this.detectAndNotifyMentions(content, author, 'Daily Updates Group Chat', newUpdate.id)

    this.broadcast({ type: 'NEW_DAILY_UPDATE', payload: newUpdate })
    return newUpdate
  }

  public toggleLikeDailyUpdate(updateId: string, userEmail: string): void {
    const store = this.getStore()
    const cleanEmail = userEmail.toLowerCase().trim()
    const update = (store.dailyUpdates || []).find((u) => u.id === updateId)

    if (update) {
      if (!update.likes) update.likes = []
      const index = update.likes.indexOf(cleanEmail)
      if (index > -1) {
        update.likes.splice(index, 1)
      } else {
        update.likes.push(cleanEmail)
      }
      this.saveStore(store)
    }
  }

  // ================= Admin Calls (Meeting Invites & Group Space) =================
  public getAdminCalls(): AdminCall[] {
    const store = this.getStore()
    return (store.adminCalls || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  public createAdminCall(
    host: User,
    title: string,
    description: string,
    meetingUrl: string,
    platform: MeetingPlatform = 'Google Meet',
    scheduledTime = 'Active Now'
  ): AdminCall {
    const store = this.getStore()
    if (!store.adminCalls) store.adminCalls = []

    const now = new Date().toISOString()
    const newCall: AdminCall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hostId: host.id,
      hostName: host.name,
      hostEmail: host.email.toLowerCase().trim(),
      hostRole: host.role,
      title: title.trim(),
      description: description.trim(),
      meetingUrl: meetingUrl.trim(),
      platform,
      scheduledTime: scheduledTime.trim(),
      status: 'active',
      createdAt: now,
    }

    store.adminCalls.unshift(newCall)

    // Notify all other company members about this video meeting invitation
    const otherUsers = store.users.filter(
      (u) => u.email.toLowerCase() !== host.email.toLowerCase()
    )
    otherUsers.forEach((u) => {
      store.notifications.unshift({
        id: `notif-call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: u.email.toLowerCase(),
        type: 'meeting_call',
        title: `📹 Call Invite: ${title}`,
        message: `${host.name} dropped a ${platform} link: "${description.slice(0, 60)}${description.length > 60 ? '...' : ''}"`,
        timestamp: now,
        read: false,
        linkId: newCall.meetingUrl,
        senderName: host.name,
      })
    })

    this.saveStore(store)

    // Process @mentions in call description
    this.detectAndNotifyMentions(description, host, `Meeting Call: ${title}`, newCall.id)

    this.broadcast({ type: 'NEW_ADMIN_CALL', payload: newCall })
    return newCall
  }

  public deleteAdminCall(callId: string): void {
    const store = this.getStore()
    store.adminCalls = (store.adminCalls || []).filter((c) => c.id !== callId)
    this.saveStore(store)
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
    return (store.notifications || []).filter((n) => {
      if (role === 'admin' && n.recipientEmail === 'admin') {
        return true
      }
      return n.recipientEmail.toLowerCase().trim() === cleanEmail
    })
  }

  public markAllNotificationsAsRead(userEmail: string, role: 'admin' | 'employee'): void {
    const store = this.getStore()
    const cleanEmail = userEmail.toLowerCase().trim()
    store.notifications = (store.notifications || []).map((n) => {
      if (role === 'admin' && n.recipientEmail === 'admin') {
        return { ...n, read: true }
      }
      if (n.recipientEmail.toLowerCase().trim() === cleanEmail) {
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
    a.download = `enterprise_cloud_store_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const storageService = new StorageService()
export default storageService
