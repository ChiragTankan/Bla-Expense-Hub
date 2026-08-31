import React, { useState, useEffect, useRef } from 'react'
import type { User, DirectMessage } from '../types'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface DirectMessagesViewProps {
  currentUser: User
}

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadUsersAndDMs = () => {
    const all = storageService.getUsers().filter(
      (u) => u.email.toLowerCase() !== currentUser.email.toLowerCase()
    )
    setUsers(all)

    if (!selectedUser && all.length > 0) {
      setSelectedUser(all[0])
    }
  }

  const loadCurrentThread = () => {
    if (selectedUser) {
      const thread = storageService.getDirectMessages(currentUser.email, selectedUser.email)
      setMessages(thread)
      storageService.markDMsAsRead(currentUser.email, selectedUser.email)
    }
  }

  useEffect(() => {
    loadUsersAndDMs()
  }, [])

  useEffect(() => {
    loadCurrentThread()
  }, [selectedUser])

  // Real-time synchronization subscription
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      loadUsersAndDMs()
      loadCurrentThread()
    })
    return () => unsubscribe()
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedUser) return

    storageService.sendDirectMessage(currentUser, selectedUser, inputText.trim())
    setInputText('')
    loadCurrentThread()
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  return (
    <div className="brand-section-card" style={{ padding: '0', overflow: 'hidden', height: '640px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%', minHeight: 0 }}>
        {/* Sidebar: Users Directory */}
        <div
          style={{
            borderRight: '1px solid var(--surface-hairline)',
            backgroundColor: 'var(--surface-soft)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-hairline)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Direct Messages (DMs)
            </div>
            <input
              type="text"
              placeholder="Search team members..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="brand-input"
              style={{ height: '36px', fontSize: '13px' }}
            />
          </div>

          {/* User List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--steel)', fontSize: '13px' }}>
                No colleagues found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const unread = storageService.getUnreadDMCountForUser(currentUser.email, u.email)
                const isSelected = selectedUser?.email === u.email

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--surface-canvas)' : 'transparent',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      marginBottom: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div className="brand-flow-avatar" style={{ backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'var(--surface-hairline)', color: isSelected ? 'var(--color-primary)' : 'var(--ink-deep)' }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--steel)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {u.department || (u.role === 'admin' ? 'Administrator' : 'Staff')}
                        </div>
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="brand-badge-counter" style={{ flexShrink: 0 }}>
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Chat Pane */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, backgroundColor: 'var(--surface-canvas)' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--surface-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--surface-canvas)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="brand-flow-avatar" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                    {selectedUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                      {selectedUser.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
                      {selectedUser.email} • {selectedUser.department || (selectedUser.role === 'admin' ? 'Administrator' : 'Operations')}
                    </div>
                  </div>
                </div>

                <div className="brand-status-pill approved" style={{ fontSize: '11px' }}>
                  <span className="brand-status-dot" />
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Message Thread */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--surface-soft)',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--slate)', maxWidth: '360px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-deep)', marginBottom: '4px' }}>
                      Start a private direct conversation
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Messages between you and {selectedUser.name} are delivered securely in real-time. You can type @ to tag users.
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderEmail.toLowerCase() === currentUser.email.toLowerCase()

                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 16px',
                            borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            backgroundColor: isMe ? 'var(--color-primary)' : 'var(--surface-canvas)',
                            color: isMe ? '#ffffff' : 'var(--ink-deep)',
                            border: isMe ? 'none' : '1px solid var(--surface-hairline)',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                        >
                          {m.content}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--steel)', marginTop: '4px', padding: '0 4px' }}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--surface-hairline)',
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: 'var(--surface-canvas)',
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.name}... (Type @ to mention)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="brand-input"
                  style={{ flex: 1, height: '42px', fontSize: '14px' }}
                />
                <button
                  type="submit"
                  className="brand-btn-cobalt brand-btn-sm"
                  disabled={!inputText.trim()}
                  style={{ height: '42px', padding: '0 22px' }}
                >
                  Send ↗
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--slate)' }}>
              Select a colleague from the left directory to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DirectMessagesView
