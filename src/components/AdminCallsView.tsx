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
  const [endingCall, setEndingCall] = useState<AdminCall | null>(null)
  const [momInput, setMomInput] = useState('')
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  const loadCalls = () => {
    setCalls(storageService.getAdminCalls())
  }

  useEffect(() => {
    storageService.pullFromSupabase().then(() => {
      loadCalls()
    })
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

  const handleOpenEndModal = (call: AdminCall) => {
    setEndingCall(call)
    setMomInput(call.momNote || '')
  }

  const handleSaveMOMAndEnd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!endingCall) return

    storageService.endAdminCall(endingCall.id, momInput, currentUser.name)
    setEndingCall(null)
    setMomInput('')
    loadCalls()
    setAlertMsg('Meeting concluded and Minutes of Meeting (MOM) saved to past meets sticky wall.')
    setTimeout(() => setAlertMsg(null), 4000)
  }

  const getPlatformIcon = (platform: string) => {
    if (platform === 'Google Meet') return '🎥'
    if (platform === 'Zoom') return '📹'
    if (platform === 'Microsoft Teams') return '👥'
    return '📞'
  }

  const activeCalls = calls.filter((c) => c.status !== 'ended')
  const pastCalls = calls.filter((c) => c.status === 'ended')

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
              <span>●</span> Live Meeting Space & Past Records
            </div>
            <h2 className="brand-section-title">Admin & Team Calls</h2>
            <p className="brand-section-desc">
              Drop Google Meet, Zoom, or Teams video links with agendas, and record Minutes of Meeting (MOM) sticky notes when calls conclude.
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

      {/* 1. Active & Scheduled Calls Stream */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--state-success)', display: 'inline-block' }} />
          Active & Scheduled Meetings ({activeCalls.length})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {activeCalls.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '36px 20px', textAlign: 'center', color: 'var(--slate)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📹</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-deep)', marginBottom: '4px' }}>
                No active meeting calls right now.
              </div>
              <div style={{ fontSize: '13px' }}>
                Click "+ Drop Meeting Link / Invite" above to start an instant Google Meet or schedule a call.
              </div>
            </div>
          ) : (
            activeCalls.map((call) => {
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
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getPlatformIcon(call.platform)}</span>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                            {call.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--steel)' }}>
                            {call.platform} • By {call.hostName} ({call.hostRole.toUpperCase()})
                          </div>
                        </div>
                      </div>

                      <span
                        className="brand-status-pill approved"
                        style={{ fontSize: '10px', textTransform: 'uppercase' }}
                      >
                        <span className="brand-status-dot" />
                        {call.scheduledTime}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {call.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--surface-hairline-soft)', paddingTop: '12px', flexWrap: 'wrap' }}>
                    <a
                      href={call.meetingUrl.startsWith('http') ? call.meetingUrl : `https://${call.meetingUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brand-btn-cobalt brand-btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      Join Call ↗
                    </a>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          className="brand-btn-secondary brand-btn-sm"
                          onClick={() => handleOpenEndModal(call)}
                          title="Conclude call and add Minutes of Meeting"
                        >
                          End & MOM 📝
                        </button>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          className="brand-btn-secondary brand-btn-sm"
                          style={{ borderColor: 'var(--state-critical)', color: 'var(--state-critical)' }}
                          onClick={() => handleDeleteCall(call.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Past Meets & Minutes of Meeting (MOM) Sticky Notes Wall */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📝 Past Meets & Minutes of Meeting (MOM Notes) ({pastCalls.length})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--steel)' }}>
            Sticky notes recorded by administrators after meeting conclusion.
          </div>
        </div>

        {pastCalls.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--slate)', backgroundColor: 'var(--surface-soft)', borderRadius: 'var(--radius-lg)' }}>
            No past meetings archived yet. When an active call ends, administrators can write Minutes of Meeting (MOM) sticky notes here.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {pastCalls.map((call) => (
              <div
                key={call.id}
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                      📌 {call.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>
                      Host: {call.hostName} • Ended {call.endedAt ? new Date(call.endedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#d48806', backgroundColor: '#fff1b8', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    MOM RECORDED
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--charcoal)' }}>
                  <strong>Agenda:</strong> {call.description}
                </div>

                {/* Sticky Note MOM Content */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px dashed #d48806',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: 'var(--ink-deep)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#d48806', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Minutes of Meeting (MOM) — By {call.endedBy || 'Admin'}:
                  </div>
                  {call.momNote || 'No specific MOM notes recorded.'}
                </div>

                {currentUser.role === 'admin' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="brand-link"
                      style={{ fontSize: '12px' }}
                      onClick={() => handleOpenEndModal(call)}
                    >
                      Edit MOM ✎
                    </button>
                    <button
                      type="button"
                      className="brand-link"
                      style={{ fontSize: '12px', color: 'var(--state-critical)' }}
                      onClick={() => handleDeleteCall(call.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Create Video Meeting Link */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onCallCreated={() => {
          loadCalls()
          setAlertMsg('Meeting link published and invites broadcasted to all colleagues.')
          setTimeout(() => setAlertMsg(null), 4000)
        }}
      />

      {/* Modal 2: End Meeting & Add MOM Sticky Note */}
      {endingCall && (
        <div className="brand-modal-overlay" onClick={() => setEndingCall(null)}>
          <div
            className="brand-modal-card brand-modal-md"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fffdf5', border: '1px solid #ffe58f' }}
          >
            <div className="brand-modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                  📝 Conclude Meeting & Add MOM Sticky Note
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '2px' }}>
                  {endingCall.title} ({endingCall.platform})
                </p>
              </div>
              <button
                type="button"
                className="brand-modal-close"
                onClick={() => setEndingCall(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMOMAndEnd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="brand-field">
                <label className="brand-label">
                  Minutes of Meeting (MOM) & Key Takeaways:
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Record key discussion points, decisions made, action items, and assigned owners..."
                  value={momInput}
                  onChange={(e) => setMomInput(e.target.value)}
                  className="brand-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="brand-modal-footer">
                <button
                  type="button"
                  className="brand-btn-secondary brand-btn-sm"
                  onClick={() => setEndingCall(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="brand-btn-cobalt brand-btn-sm"
                >
                  Save MOM & Conclude Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCallsView
