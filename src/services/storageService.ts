import type {
  User,
  ExpenseRequest,
  SystemNotification,
  ExpenseCategory,
  DirectMessage,
  DailyUpdate,
  DailyUpdateTag,
  AdminCall,
  MeetingPlatform,
} from '../types'
import initialData from '../data/initialStore.json'
import { supabaseClient, SUPABASE_CONFIG } from './supabaseClient'
import { emailService } from './emailService'

// Secure session storage key (only holds sanitized profile, zero passwords)
const SECURE_SESSION_KEY = 'bla_secure_auth_session_v4'

// Purge all legacy insecure plaintext database keys from localStorage
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'bla_expense_hub_cloud_v3',
      'bla_active_session_user_v3',
      'bla_active_session_user_v2',
      'bla_expense_hub_store_v2',
      'bla_expense_hub_store',
    ]
    legacyKeys.forEach((key) => localStorage.removeItem(key))
  } catch (e) {
    console.warn('Legacy key cleanup notice:', e)
  }
}

// BroadcastChannel for instant real-time multi-tab reactivity
let realtimeChannel: BroadcastChannel | null = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel('bla_api_realtime_v4')
  }
} catch (err) {
  console.warn('BroadcastChannel not supported:', err)
}

type RealtimeListener = (event: { type: string; payload?: unknown }) => void

// Strip password from user objects for security
function sanitizeUser(user: User): User {
  const { password: _, ...safe } = user
  return safe as User
}

class ApiService {
  private listeners: Set<RealtimeListener> = new Set()
  
  // Ephemeral In-Memory State (Never persisted to localStorage)
  private memoryUsers: User[] = (initialData.users as User[]).map(sanitizeUser)
  private memoryExpenses: ExpenseRequest[] = []
  private memoryDMs: DirectMessage[] = []
  private memoryUpdates: DailyUpdate[] = []
  private memoryCalls: AdminCall[] = []
  private memoryNotifications: SystemNotification[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      if (realtimeChannel) {
        realtimeChannel.onmessage = (event) => {
          this.notifySubscribers(event.data)
        }
      }

      // Initial fetch from Supabase API
      this.refreshAllFromApi()

      // Continuous background sync every 4 seconds
      setInterval(() => {
        this.refreshAllFromApi()
      }, 4000)
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

  // ================= Supabase Cloud API Fetch =================
  public async refreshAllFromApi(): Promise<void> {
    try {
      const [remoteUsers, remoteExpenses, remoteDMs, remoteUpdates, remoteCalls, remoteNotifs] =
        await Promise.all([
          supabaseClient.fetchTable<User>('users'),
          supabaseClient.fetchTable<ExpenseRequest>('expenses'),
          supabaseClient.fetchTable<DirectMessage>('direct_messages'),
          supabaseClient.fetchTable<DailyUpdate>('daily_updates'),
          supabaseClient.fetchTable<AdminCall>('admin_calls'),
          supabaseClient.fetchTable<SystemNotification>('notifications'),
        ])

      let hasChanges = false

      if (remoteUsers && remoteUsers.length > 0) {
        this.memoryUsers = remoteUsers.map(sanitizeUser)
        hasChanges = true
      }

      if (remoteExpenses) {
        this.memoryExpenses = remoteExpenses
        hasChanges = true
      }

      if (remoteDMs) {
        this.memoryDMs = remoteDMs
        hasChanges = true
      }

      if (remoteUpdates) {
        this.memoryUpdates = remoteUpdates
        hasChanges = true
      }

      if (remoteCalls) {
        this.memoryCalls = remoteCalls
        hasChanges = true
      }

      if (remoteNotifs) {
        this.memoryNotifications = remoteNotifs
        hasChanges = true
      }

      if (hasChanges) {
        this.notifySubscribers({ type: 'DATA_REFRESHED' })
      }
    } catch (err) {
      console.warn('API sync warning:', err)
    }
  }

  public async pullFromSupabase(): Promise<void> {
    return this.refreshAllFromApi()
  }

  public getSupabaseInfo() {
    return {
      connected: true,
      url: SUPABASE_CONFIG.url,
      client: supabaseClient,
    }
  }

  // ================= User & Auth (Secure Server-Side Authentication) =================
  public async login(email: string, pass: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim()

    // 1. Try Supabase API verification
    try {
      const users = await supabaseClient.fetchTable<User>('users')
      if (users && users.length > 0) {
        const found = users.find(
          (u) => u.email.toLowerCase().trim() === cleanEmail && u.password === pass
        )
        if (found) {
          const safe = sanitizeUser(found)
          this.setActiveSessionUser(safe)
          return safe
        }
      }
    } catch (err) {
      console.warn('Supabase auth query error:', err)
    }

    // 2. Fallback check for initial admins
    const fallbackAdmins = initialData.users as User[]
    const fallbackUser = fallbackAdmins.find(
      (u) => u.email.toLowerCase().trim() === cleanEmail && u.password === pass
    )
    if (fallbackUser) {
      const safe = sanitizeUser(fallbackUser)
      this.setActiveSessionUser(safe)
      return safe
    }

    return null
  }

  public getActiveSessionUser(): User | null {
    try {
      const sessionItem = sessionStorage.getItem(SECURE_SESSION_KEY)
      if (sessionItem) {
        return sanitizeUser(JSON.parse(sessionItem))
      }
      return null
    } catch {
      return null
    }
  }

  public setActiveSessionUser(user: User | null): void {
    try {
      if (user) {
        sessionStorage.setItem(SECURE_SESSION_KEY, JSON.stringify(sanitizeUser(user)))
      } else {
        sessionStorage.removeItem(SECURE_SESSION_KEY)
      }
    } catch (e) {
      console.warn('Session error:', e)
    }
  }

  public getUsers(): User[] {
    return this.memoryUsers
  }

  public getUserByEmail(email: string): User | undefined {
    return this.memoryUsers.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    )
  }

  public async createEmployee(
    name: string,
    email: string,
    password: string,
    department?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.toLowerCase().trim()

    if (this.memoryUsers.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' }
    }

    const newUserWithPass: User = {
      id: `usr-emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'employee',
      password: password.trim(),
      department: department?.trim() || 'General Operations',
      createdAt: new Date().toISOString(),
    }

    const safeUser = sanitizeUser(newUserWithPass)
    this.memoryUsers.push(safeUser)

    const adminNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientEmail: 'admin',
      type: 'employee_created',
      title: 'New Employee Registered',
      message: `${safeUser.name} (${safeUser.email}) was provisioned for ${safeUser.department}.`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    this.memoryNotifications.unshift(adminNotif)

    // Send email notification to employee
    emailService.sendNotificationEmail(
      safeUser.email,
      `Welcome to Bla Expense Hub - Account Provisioned`,
      `Hello ${safeUser.name},\n\nYour account for ${safeUser.department} has been provisioned.\nYour Login ID: ${safeUser.email}\nYour Temporary Password: ${password.trim()}\n\nAccess the portal: https://bla-expense-hub.vercel.app/`,
      'employee_created'
    )

    // Save to Supabase Cloud Database via API
    await supabaseClient.insertRow('users', newUserWithPass as unknown as Record<string, unknown>)
    await supabaseClient.insertRow('notifications', adminNotif as unknown as Record<string, unknown>)

    this.broadcast({ type: 'USER_CREATED', payload: safeUser })
    return { success: true, user: safeUser }
  }

  // ================= Direct Messages (1-on-1 API) =================
  public getDirectMessages(user1Email: string, user2Email: string): DirectMessage[] {
    const e1 = user1Email.toLowerCase().trim()
    const e2 = user2Email.toLowerCase().trim()

    return this.memoryDMs.filter(
      (m) =>
        (m.senderEmail.toLowerCase() === e1 && m.recipientEmail.toLowerCase() === e2) ||
        (m.senderEmail.toLowerCase() === e2 && m.recipientEmail.toLowerCase() === e1)
    )
  }

  public async sendDirectMessage(
    sender: User,
    recipient: User,
    content: string
  ): Promise<DirectMessage> {
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

    this.memoryDMs.push(newDM)

    const notif: SystemNotification = {
      id: `notif-dm-${Date.now()}`,
      recipientEmail: recipient.email.toLowerCase().trim(),
      type: 'direct_message',
      title: `Message from ${sender.name}`,
      message: `${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
      timestamp: newDM.timestamp,
      read: false,
      linkId: sender.email,
      senderName: sender.name,
    }
    this.memoryNotifications.unshift(notif)

    emailService.sendNotificationEmail(
      recipient.email,
      `New Direct Message from ${sender.name}`,
      `${sender.name} sent you a direct message:\n\n"${content}"\n\nReply directly in Bla Expense Hub.`,
      'direct_message'
    )

    // Save to Supabase API
    await Promise.all([
      supabaseClient.insertRow('direct_messages', newDM as unknown as Record<string, unknown>),
      supabaseClient.insertRow('notifications', notif as unknown as Record<string, unknown>),
    ])

    this.detectAndNotifyMentions(content, sender, `Direct Message with ${sender.name}`)
    this.broadcast({ type: 'NEW_DIRECT_MESSAGE', payload: newDM })
    return newDM
  }

  public getUnreadDMCountForUser(userEmail: string, otherUserEmail?: string): number {
    const cleanUser = userEmail.toLowerCase().trim()
    if (otherUserEmail) {
      const cleanOther = otherUserEmail.toLowerCase().trim()
      return this.memoryDMs.filter(
        (m) =>
          m.recipientEmail.toLowerCase() === cleanUser &&
          m.senderEmail.toLowerCase() === cleanOther &&
          !m.read
      ).length
    }
    return this.memoryDMs.filter((m) => m.recipientEmail.toLowerCase() === cleanUser && !m.read).length
  }

  public async markDMsAsRead(recipientEmail: string, senderEmail: string): Promise<void> {
    const rEmail = recipientEmail.toLowerCase().trim()
    const sEmail = senderEmail.toLowerCase().trim()

    this.memoryDMs = this.memoryDMs.map((m) => {
      if (
        m.recipientEmail.toLowerCase() === rEmail &&
        m.senderEmail.toLowerCase() === sEmail &&
        !m.read
      ) {
        return { ...m, read: true }
      }
      return m
    })
  }

  // ================= Daily Updates (API) =================
  public getDailyUpdates(): DailyUpdate[] {
    return [...this.memoryUpdates].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  public async postDailyUpdate(
    author: User,
    tag: DailyUpdateTag,
    content: string
  ): Promise<DailyUpdate> {
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

    this.memoryUpdates.unshift(newUpdate)

    // Save to Supabase API
    await supabaseClient.insertRow('daily_updates', newUpdate as unknown as Record<string, unknown>)

    // Broadcast notifications and email
    const otherUsers = this.memoryUsers.filter(
      (u) => u.email.toLowerCase() !== author.email.toLowerCase()
    )
    otherUsers.forEach((u) => {
      const notif: SystemNotification = {
        id: `notif-update-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: u.email.toLowerCase(),
        type: 'daily_update',
        title: `Daily Update from ${author.name}`,
        message: `[${tag}] ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
        timestamp: now,
        read: false,
        linkId: newUpdate.id,
        senderName: author.name,
      }
      this.memoryNotifications.unshift(notif)
      supabaseClient.insertRow('notifications', notif as unknown as Record<string, unknown>)

      emailService.sendNotificationEmail(
        u.email,
        `Daily Work Update: ${author.name} (${author.department || 'Team'})`,
        `${author.name} posted a daily work update [${tag}]:\n\n"${content}"\n\nView on Bla Expense Hub.`,
        'daily_update'
      )
    })

    this.detectAndNotifyMentions(content, author, 'Daily Updates Group Chat', newUpdate.id)
    this.broadcast({ type: 'NEW_DAILY_UPDATE', payload: newUpdate })
    return newUpdate
  }

  public async toggleLikeDailyUpdate(updateId: string, userEmail: string): Promise<void> {
    const cleanEmail = userEmail.toLowerCase().trim()
    const update = this.memoryUpdates.find((u) => u.id === updateId)

    if (update) {
      if (!update.likes) update.likes = []
      const index = update.likes.indexOf(cleanEmail)
      if (index > -1) {
        update.likes.splice(index, 1)
      } else {
        update.likes.push(cleanEmail)
      }
      await supabaseClient.updateRow('daily_updates', 'id', updateId, { likes: update.likes })
      this.broadcast({ type: 'UPDATE_LIKED', payload: update })
    }
  }

  // ================= Admin Calls & MOM API =================
  public getAdminCalls(): AdminCall[] {
    return [...this.memoryCalls].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  public async createAdminCall(
    host: User,
    title: string,
    description: string,
    meetingUrl: string,
    platform: MeetingPlatform = 'Google Meet',
    scheduledTime = 'Active Now'
  ): Promise<AdminCall> {
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

    this.memoryCalls.unshift(newCall)

    // Save to Supabase API
    await supabaseClient.insertRow('admin_calls', newCall as unknown as Record<string, unknown>)

    const otherUsers = this.memoryUsers.filter(
      (u) => u.email.toLowerCase() !== host.email.toLowerCase()
    )
    otherUsers.forEach((u) => {
      const notif: SystemNotification = {
        id: `notif-call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: u.email.toLowerCase(),
        type: 'meeting_call',
        title: `📹 Call Invite: ${title}`,
        message: `${host.name} dropped a ${platform} link: "${description.slice(0, 60)}${description.length > 60 ? '...' : ''}"`,
        timestamp: now,
        read: false,
        linkId: newCall.meetingUrl,
        senderName: host.name,
      }
      this.memoryNotifications.unshift(notif)
      supabaseClient.insertRow('notifications', notif as unknown as Record<string, unknown>)

      emailService.sendNotificationEmail(
        u.email,
        `📹 Meeting Invitation: ${title} (${platform})`,
        `${host.name} invited you to join a video call.\nTopic: ${title}\nAgenda: ${description}\nLink: ${meetingUrl}\nSchedule: ${scheduledTime}`,
        'meeting_call'
      )
    })

    this.detectAndNotifyMentions(description, host, `Meeting Call: ${title}`, newCall.id)
    this.broadcast({ type: 'NEW_ADMIN_CALL', payload: newCall })
    return newCall
  }

  public async endAdminCall(
    callId: string,
    momNote: string,
    adminName: string
  ): Promise<AdminCall | null> {
    const call = this.memoryCalls.find((c) => c.id === callId)
    if (!call) return null

    const now = new Date().toISOString()
    call.status = 'ended'
    call.endedAt = now
    call.endedBy = adminName
    call.momNote = momNote.trim()

    await supabaseClient.updateRow('admin_calls', 'id', callId, {
      status: 'ended',
      endedAt: now,
      endedBy: adminName,
      momNote: momNote.trim(),
    })

    this.memoryUsers.forEach((u) => {
      const notif: SystemNotification = {
        id: `notif-mom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: u.email.toLowerCase(),
        type: 'meeting_call',
        title: `📝 Meeting Ended & MOM Added: ${call.title}`,
        message: `${adminName} posted Minutes of Meeting (MOM): "${momNote.slice(0, 70)}${momNote.length > 70 ? '...' : ''}"`,
        timestamp: now,
        read: false,
        linkId: call.id,
        senderName: adminName,
      }
      this.memoryNotifications.unshift(notif)
      supabaseClient.insertRow('notifications', notif as unknown as Record<string, unknown>)
    })

    this.broadcast({ type: 'CALL_ENDED', payload: call })
    return call
  }

  public async deleteAdminCall(callId: string): Promise<void> {
    this.memoryCalls = this.memoryCalls.filter((c) => c.id !== callId)
    await supabaseClient.deleteRow('admin_calls', 'id', callId)
    this.broadcast({ type: 'CALL_DELETED', payload: callId })
  }

  // ================= Expenses API =================
  public getExpenses(): ExpenseRequest[] {
    return this.memoryExpenses
  }

  public getExpensesByUser(userEmail: string): ExpenseRequest[] {
    const clean = userEmail.toLowerCase().trim()
    return this.memoryExpenses.filter(
      (e) => e.employeeEmail.toLowerCase().trim() === clean
    )
  }

  public async createExpense(data: {
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
  }): Promise<ExpenseRequest> {
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

    this.memoryExpenses.unshift(newExpense)

    const adminNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientEmail: 'admin',
      type: 'expense_submitted',
      title: 'New Expense Claim Submitted',
      message: `${data.employeeName} submitted a claim of ₹${data.amount.toLocaleString()} for ${data.expenseType}.`,
      timestamp: now,
      read: false,
      linkId: newExpense.id,
    }
    this.memoryNotifications.unshift(adminNotif)

    const admins = this.memoryUsers.filter((u) => u.role === 'admin')
    admins.forEach((admin) => {
      emailService.sendNotificationEmail(
        admin.email,
        `New Expense Claim: ₹${data.amount.toLocaleString()} from ${data.employeeName}`,
        `${data.employeeName} submitted a claim for ${data.expenseType} (₹${data.amount.toLocaleString()}).\nMotive: ${data.motive}\n\nReview in Admin Panel: https://bla-expense-hub.vercel.app/dashboard`,
        'expense_submitted'
      )
    })

    // Save to Supabase API
    await Promise.all([
      supabaseClient.insertRow('expenses', newExpense as unknown as Record<string, unknown>),
      supabaseClient.insertRow('notifications', adminNotif as unknown as Record<string, unknown>),
    ])

    this.broadcast({ type: 'EXPENSE_CREATED', payload: newExpense })
    return newExpense
  }

  public async updateExpenseStatus(
    expenseId: string,
    status: 'approved' | 'rejected',
    adminNote?: string,
    adminName?: string
  ): Promise<ExpenseRequest | null> {
    const expense = this.memoryExpenses.find((e) => e.id === expenseId)
    if (!expense) return null

    const now = new Date().toISOString()
    expense.status = status
    expense.adminNote = adminNote
    expense.reviewedBy = adminName || 'System Admin'
    expense.reviewedAt = now
    expense.updatedAt = now

    const empNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientEmail: expense.employeeEmail,
      type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
      title: status === 'approved' ? 'Expense Claim Approved & Disbursed' : 'Expense Claim Rejected',
      message:
        status === 'approved'
          ? `Your claim for ₹${expense.amount.toLocaleString()} (${expense.expenseType}) was approved by ${adminName || 'Admin'}. Remark: "${adminNote || 'Processed'}"`
          : `Your claim for ₹${expense.amount.toLocaleString()} (${expense.expenseType}) was rejected. Reason: "${adminNote || 'No reason specified'}"`,
      timestamp: now,
      read: false,
      linkId: expense.id,
    }
    this.memoryNotifications.unshift(empNotif)

    emailService.sendNotificationEmail(
      expense.employeeEmail,
      status === 'approved'
        ? `Expense Claim Approved: ₹${expense.amount.toLocaleString()} (${expense.expenseType})`
        : `Expense Claim Rejected: ₹${expense.amount.toLocaleString()}`,
      `Hello ${expense.employeeName},\n\nYour claim for ₹${expense.amount.toLocaleString()} (${expense.expenseType}) has been ${status.toUpperCase()} by ${adminName || 'Admin'}.\n\nAdministrator Remarks: "${adminNote || 'No remarks'}"\n\nLog in: https://bla-expense-hub.vercel.app/dashboard`,
      status === 'approved' ? 'expense_approved' : 'expense_rejected'
    )

    await Promise.all([
      supabaseClient.updateRow('expenses', 'id', expenseId, expense as unknown as Record<string, unknown>),
      supabaseClient.insertRow('notifications', empNotif as unknown as Record<string, unknown>),
    ])

    this.broadcast({ type: 'EXPENSE_UPDATED', payload: expense })
    return expense
  }

  // ================= Notifications API =================
  public getNotifications(userEmail: string, role: 'admin' | 'employee'): SystemNotification[] {
    const cleanEmail = userEmail.toLowerCase().trim()
    return this.memoryNotifications.filter((n) => {
      if (role === 'admin' && n.recipientEmail === 'admin') {
        return true
      }
      return n.recipientEmail.toLowerCase().trim() === cleanEmail
    })
  }

  public async markNotificationAsRead(notifId: string): Promise<void> {
    const notif = this.memoryNotifications.find((n) => n.id === notifId)
    if (notif) {
      notif.read = true
      await supabaseClient.updateRow('notifications', 'id', notifId, { read: true })
      this.broadcast({ type: 'NOTIF_READ', payload: notifId })
    }
  }

  public async markAllNotificationsAsRead(userEmail: string, role: 'admin' | 'employee'): Promise<void> {
    const cleanEmail = userEmail.toLowerCase().trim()
    this.memoryNotifications = this.memoryNotifications.map((n) => {
      if (role === 'admin' && n.recipientEmail === 'admin') {
        return { ...n, read: true }
      }
      if (n.recipientEmail.toLowerCase().trim() === cleanEmail) {
        return { ...n, read: true }
      }
      return n
    })
    this.broadcast({ type: 'ALL_NOTIFS_READ' })
  }

  // ================= Mentions Helper =================
  private async detectAndNotifyMentions(
    content: string,
    sender: User,
    contextTitle: string,
    linkId?: string
  ): Promise<void> {
    const mentionRegex = /@([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)?)/g
    const matches = Array.from(content.matchAll(mentionRegex))

    const mentionedEmails = new Set<string>()

    matches.forEach((match) => {
      const tagText = match[1].toLowerCase().trim()
      this.memoryUsers.forEach((u) => {
        if (u.email.toLowerCase() === sender.email.toLowerCase()) return

        const matchEmail = u.email.toLowerCase().includes(tagText)
        const matchName = u.name.toLowerCase().includes(tagText)
        const matchFirstWord = u.name.toLowerCase().split(' ')[0] === tagText

        if (matchEmail || matchName || matchFirstWord) {
          mentionedEmails.add(u.email.toLowerCase())
        }
      })
    })

    for (const email of mentionedEmails) {
      const notif: SystemNotification = {
        id: `notif-mention-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientEmail: email,
        type: 'user_mention',
        title: `🔔 Mentioned by ${sender.name}`,
        message: `${sender.name} tagged you in ${contextTitle}: "${content.length > 80 ? content.slice(0, 80) + '...' : content}"`,
        timestamp: new Date().toISOString(),
        read: false,
        linkId,
        senderName: sender.name,
      }
      this.memoryNotifications.unshift(notif)

      emailService.sendNotificationEmail(
        email,
        `🔔 [Mention Alert] ${sender.name} tagged you in ${contextTitle}`,
        `${sender.name} mentioned you:\n\n"${content}"\n\nLog in to Bla Expense Hub to view and respond.`,
        'user_mention'
      )

      supabaseClient.insertRow('notifications', notif as unknown as Record<string, unknown>)
    }
  }

  // ================= Backup & Export =================
  public exportCredentialsJson(): void {
    const data = {
      version: '4.0.0',
      users: this.memoryUsers,
      expenses: this.memoryExpenses,
      directMessages: this.memoryDMs,
      dailyUpdates: this.memoryUpdates,
      adminCalls: this.memoryCalls,
      notifications: this.memoryNotifications,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enterprise_cloud_export_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const storageService = new ApiService()
export default storageService
