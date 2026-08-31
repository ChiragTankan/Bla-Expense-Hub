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
    storageService.pullFromSupabase().then(() => {
      loadUsersAndDMs()
      loadCurrentThread()
    })
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--slate)' }}>
                No colleagues found.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUser?.email.toLowerCase() === user.email.toLowerCase()
                const unreadCount = storageService.getUnreadDMCountForUser(currentUser.email, user.email)

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--surface-canvas)' : 'transparent',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-circle)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--surface-hairline)',
                          color: isSelected ? '#ffffff' : 'var(--ink-deep)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--steel)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.department || user.role}
                        </div>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <span className="brand-badge-counter">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Pane */}
        {selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, backgroundColor: 'var(--surface-canvas)' }}>
            {/* Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--surface-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-circle)',
                    backgroundColor: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                    {selectedUser.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
                    {selectedUser.email} • {selectedUser.department || 'Operations'} ({selectedUser.role.toUpperCase()})
                  </div>
                </div>
              </div>

              <div className="brand-user-role-badge" style={{ fontSize: '12px' }}>
                <span className="brand-status-dot" style={{ color: 'var(--state-success)' }} />
                <span>Active Cloud Thread</span>
              </div>
            </div>

            {/* Messages Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--slate)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-deep)' }}>
                    Direct message with {selectedUser.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--steel)', marginTop: '4px' }}>
                    Type a message below to start a private conversation. Email notifications are dispatched automatically.
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase()

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isMine ? 'var(--color-primary)' : 'var(--surface-soft)',
                          color: isMine ? '#ffffff' : 'var(--ink-deep)',
                          fontSize: '14px',
                          lineHeight: '1.45',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--steel)', marginTop: '4px', padding: '0 4px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--surface-hairline)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                backgroundColor: 'var(--surface-canvas)',
              }}
            >
              <input
                type="text"
                placeholder={`Message ${selectedUser.name}... (type @name to tag)`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="brand-input"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="brand-btn-cobalt"
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)' }}>
            Select a colleague to view messages.
          </div>
        )}
      </div>
    </div>
  )
}

export default DirectMessagesView
