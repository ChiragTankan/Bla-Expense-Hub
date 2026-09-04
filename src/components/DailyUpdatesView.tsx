import React, { useState, useEffect } from 'react'
import type { User, DailyUpdate, DailyUpdateTag } from '../types'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface DailyUpdatesViewProps {
  currentUser: User
}

const TAG_OPTIONS: DailyUpdateTag[] = [
  "Today's Focus",
  'Completed',
  'Blocker',
  'General Update',
]

export const DailyUpdatesView: React.FC<DailyUpdatesViewProps> = ({ currentUser }) => {
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [selectedTag, setSelectedTag] = useState<DailyUpdateTag>("Today's Focus")
  const [content, setContent] = useState('')
  const [filterTag, setFilterTag] = useState<'All' | DailyUpdateTag>('All')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  const loadUpdates = () => {
    setUpdates(storageService.getDailyUpdates())
  }

  useEffect(() => {
    storageService.pullFromSupabase().then(() => {
      loadUpdates()
    })
    loadUpdates()
  }, [])

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      loadUpdates()
    })
    return () => unsubscribe()
  }, [])

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setTimeout(() => {
      storageService.postDailyUpdate(currentUser, selectedTag, content.trim())
      setContent('')
      setIsSubmitting(false)
      loadUpdates()
      setAlertMsg('Your daily work update was broadcasted to the company channel.')
      setTimeout(() => setAlertMsg(null), 3500)
    }, 250)
  }

  const handleToggleLike = (updateId: string) => {
    storageService.toggleLikeDailyUpdate(updateId, currentUser.email)
    loadUpdates()
  }

  const filteredUpdates = updates.filter((u) => {
    if (filterTag === 'All') return true
    return u.tag === filterTag
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alert banner */}
      {alertMsg && (
        <div className="brand-alert brand-alert-success" role="status">
          <span>●</span>&nbsp;{alertMsg}
        </div>
      )}

      {/* Post Composer Card */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div className="brand-auth-badge" style={{ margin: 0 }}>
            <span>●</span> Company Broadcast Stream
          </div>
          <span style={{ fontSize: '13px', color: 'var(--steel)' }}>
            Share daily work progress, blockers, or completed tasks with the entire team.
          </span>
        </div>

        <form onSubmit={handlePostUpdate} className="brand-form" style={{ gap: '14px' }}>
          {/* Tag Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-deep)' }}>
              Category:
            </span>
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`brand-tab-btn ${selectedTag === tag ? 'active' : ''}`}
                style={{
                  border: selectedTag === tag ? '1px solid var(--color-primary)' : '1px solid var(--surface-hairline)',
                  color: selectedTag === tag ? 'var(--color-primary)' : 'var(--charcoal)',
                  backgroundColor: selectedTag === tag ? 'var(--color-primary-soft)' : 'var(--surface-canvas)',
                }}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === "Today's Focus" && '🎯 '}
                {tag === 'Completed' && '✅ '}
                {tag === 'Blocker' && '🛑 '}
                {tag === 'General Update' && '📢 '}
                {tag}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            required
            placeholder={`What are you working on today? (Tip: Tag colleagues by typing @name to send them an instant mention alert)`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="brand-textarea"
            style={{ fontSize: '14px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate)' }}>
              Posting as: <strong style={{ color: 'var(--ink-deep)' }}>{currentUser.name}</strong> ({currentUser.department || 'Operations'})
            </span>

            <button
              type="submit"
              className="brand-btn-cobalt brand-btn-sm"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Publishing...' : '📢 Publish Daily Update'}
            </button>
          </div>
        </form>
      </div>

      {/* Stream Feed Header & Filters */}
      <div className="brand-section-card" style={{ padding: '24px' }}>
        <div className="brand-section-header" style={{ marginBottom: '16px', paddingBottom: '16px' }}>
          <div className="brand-section-title-group">
            <h2 className="brand-section-title" style={{ fontSize: '20px' }}>
              Company Work Log Stream ({updates.length})
            </h2>
            <p className="brand-section-desc">
              Real-time daily status logs from across all teams and departments.
            </p>
          </div>

          <div className="brand-tabs-list">
            <button
              type="button"
              className={`brand-tab-btn ${filterTag === 'All' ? 'active' : ''}`}
              onClick={() => setFilterTag('All')}
            >
              All
            </button>
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`brand-tab-btn ${filterTag === tag ? 'active' : ''}`}
                onClick={() => setFilterTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Updates List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredUpdates.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-deep)' }}>
                No daily updates posted yet for this filter.
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Be the first to post your daily status update above!
              </div>
            </div>
          ) : (
            filteredUpdates.map((item) => {
              const isLiked = item.likes && item.likes.includes(currentUser.email.toLowerCase())
              const likeCount = item.likes ? item.likes.length : 0

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '18px 20px',
                    backgroundColor: 'var(--surface-soft)',
                    border: '1px solid var(--surface-hairline)',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Author Meta Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="brand-flow-avatar" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                        {item.authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-deep)' }}>
                            {item.authorName}
                          </span>
                          <span className="brand-mockup-col-badge">
                            {item.authorDepartment}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--steel)' }}>
                          {item.authorEmail} • {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Tag Badge */}
                    <span
                      className="brand-status-pill"
                      style={{
                        backgroundColor:
                          item.tag === 'Completed'
                            ? '#e3fcef'
                            : item.tag === 'Blocker'
                            ? '#ffebe6'
                            : 'var(--surface-canvas)',
                        color:
                          item.tag === 'Completed'
                            ? 'var(--state-success)'
                            : item.tag === 'Blocker'
                            ? 'var(--state-critical)'
                            : 'var(--ink-deep)',
                        border: '1px solid var(--surface-hairline)',
                      }}
                    >
                      {item.tag === "Today's Focus" && '🎯 '}
                      {item.tag === 'Completed' && '✅ '}
                      {item.tag === 'Blocker' && '🛑 '}
                      {item.tag === 'General Update' && '📢 '}
                      {item.tag}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--ink)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.content}
                  </div>

                  {/* Footer Actions (Like / Acknowledge) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--surface-hairline-soft)' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isLiked ? 'var(--color-primary)' : 'var(--charcoal)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span>{isLiked ? '👍' : '👏'}</span>
                      <span>{isLiked ? 'Acknowledged' : 'Acknowledge'}</span>
                      {likeCount > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                          ({likeCount})
                        </span>
                      )}
                    </button>

                    <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                      Real-time Synced
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyUpdatesView
