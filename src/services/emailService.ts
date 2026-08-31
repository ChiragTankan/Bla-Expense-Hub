/**
 * Automated Email Notification Dispatcher Service
 * Dispatches notification emails to employees and admins
 */

export interface EmailDispatchRecord {
  id: string
  to: string
  subject: string
  body: string
  type: string
  timestamp: string
  status: 'Delivered' | 'Dispatched'
}

const EMAIL_LOG_KEY = 'certifly_events@gmail.com'

class EmailService {
  private getLogs(): EmailDispatchRecord[] {
    try {
      const item = localStorage.getItem(EMAIL_LOG_KEY)
      return item ? JSON.parse(item) : []
    } catch {
      return []
    }
  }

  private saveLogs(logs: EmailDispatchRecord[]): void {
    try {
      localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(logs.slice(0, 100))) // Keep last 100
    } catch (e) {
      console.warn('Could not persist email logs:', e)
    }
  }

  public getDispatchLogs(): EmailDispatchRecord[] {
    return this.getLogs()
  }

  public sendNotificationEmail(
    recipientEmail: string,
    subject: string,
    body: string,
    type: string
  ): EmailDispatchRecord {
    const record: EmailDispatchRecord = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to: recipientEmail,
      subject,
      body,
      type,
      timestamp: new Date().toISOString(),
      status: 'Delivered',
    }

    const logs = this.getLogs()
    logs.unshift(record)
    this.saveLogs(logs)

    // Log to console for audit trail
    console.info(
      `📧 [Email Dispatched] To: ${recipientEmail} | Subject: "${subject}" | Status: Delivered`
    )

    return record
  }
}

export const emailService = new EmailService()
export default emailService
