import React, { useState, useEffect } from 'react'
import type { User, AdminCall } from '../types'
import storageService from '../services/storageService'
import { CreateCallModal } from './CreateCallModal'
import '../styles/design-tokens.css'

interface AdminCallsViewProps {
  currentUser: User
}

export const AdminCallsView: React.FC<AdminCallsViewProps> = ({ currentUser }) => {
  const [calls, setCalls] = useState<AdminCall[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  const loadCalls = () => {
    setCalls(storageService.getAdminCalls())
  }

  useEffect(() => {
    loadCalls()
  }, [])

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      loadCalls()
    })
    return () => unsubscribe()
  }, [])

  const handleDeleteCall = (callId: string) => {
    storageService.deleteAdminCall(callId)
    loadCalls()
    setAlertMsg('Meeting call room removed.')
    setTimeout(() => setAlertMsg(null), 3000)
  }

  const getPlatformIcon = (platform: string) => {
    if (platform === 'Google Meet') return '🎥'
    if (platform === 'Zoom') return '📹'
    if (platform === 'Microsoft Teams') return '👥'
    return '📞'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alert Notification */}
      {alertMsg && (
        <div className="brand-alert brand-alert-success" role="status">
          <span>●</span>&nbsp;{alertMsg}
        </div>
      )}

      {/* Header Card */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div className="brand-section-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0' }}>
          <div className="brand-section-title-group">
            <div className="brand-auth-badge" style={{ marginBottom: '6px' }}>
              <span>●</span> Live Meeting Space
            </div>
            <h2 className="brand-section-title">Admin & Team Calls</h2>
            <p className="brand-section-desc">
              Drop Google Meet, Zoom, or Teams video links with agendas for instant or scheduled team calls.
            </p>
          </div>

          <button
            type="button"
            className="brand-btn-cobalt"
            style={{ width: 'auto', padding: '12px 24px' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Drop Meeting Link / Invite
          </button>
        </div>
      </div>

      {/* Active Calls Stream */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
          Active & Scheduled Meetings ({calls.length})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {calls.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📹</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-deep)', marginBottom: '4px' }}>
                No active meeting calls right now.
              </div>
              <div style={{ fontSize: '13px' }}>
                Click "+ Drop Meeting Link / Invite" above to start an instant Google Meet or schedule a call.
              </div>
            </div>
          ) : (
            calls.map((call) => {
              const isHost = call.hostEmail.toLowerCase() === currentUser.email.toLowerCase()
              const canManage = isHost || currentUser.role === 'admin'

              return (
                <div
                  key={call.id}
                  style={{
                    backgroundColor: 'var(--surface-soft)',
                    border: '1px solid var(--surface-hairline)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Top Row: Platform Badge & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span className="brand-mockup-col-badge" style={{ backgroundColor: 'var(--surface-canvas)', color: 'var(--color-primary-deep)', fontWeight: 700 }}>
                        {getPlatformIcon(call.platform)} {call.platform}
                      </span>

                      <span className="brand-status-pill approved" style={{ fontSize: '10px' }}>
                        <span className="brand-status-dot" />
                        {call.scheduledTime}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink-deep)', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                        {call.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--charcoal)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {call.description}
                      </p>
                    </div>

                    {/* Host Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--surface-hairline-soft)' }}>
                      <div className="brand-flow-avatar" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                        {call.hostName.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--slate)' }}>
                        Hosted by <strong style={{ color: 'var(--ink-deep)' }}>{call.hostName}</strong> ({call.hostRole === 'admin' ? 'Admin' : 'Staff'})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--surface-hairline-soft)' }}>
                    <a
                      href={call.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brand-btn-cobalt brand-btn-sm"
                      style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}
                    >
                      Join Call ↗
                    </a>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCall(call.id)}
                        className="brand-btn-secondary brand-btn-sm"
                        style={{ borderColor: 'var(--surface-hairline)', color: 'var(--steel)' }}
                        title="End / remove meeting link"
                      >
                        End
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create Call Modal */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onCallCreated={() => {
          loadCalls()
          setAlertMsg('Meeting link published and company members notified.')
          setTimeout(() => setAlertMsg(null), 4000)
        }}
      />
    </div>
  )
}

export default AdminCallsView
