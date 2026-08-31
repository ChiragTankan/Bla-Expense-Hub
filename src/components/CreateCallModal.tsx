import React, { useState } from 'react'
import type { User, MeetingPlatform } from '../types'
import storageService from '../services/storageService'
import '../styles/design-tokens.css'

interface CreateCallModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  onCallCreated: () => void
}

const PLATFORMS: MeetingPlatform[] = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Other']

export const CreateCallModal: React.FC<CreateCallModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCallCreated,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [platform, setPlatform] = useState<MeetingPlatform>('Google Meet')
  const [scheduledTime, setScheduledTime] = useState('Active Now • Instant Call')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please provide a meeting title / topic.')
      return
    }

    if (!meetingUrl.trim() || (!meetingUrl.startsWith('http://') && !meetingUrl.startsWith('https://'))) {
      setError('Please enter a valid video meeting URL.')
      return
    }

    if (!description.trim()) {
      setError('Please provide a brief agenda or description.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      storageService.createAdminCall(
        currentUser,
        title.trim(),
        description.trim(),
        meetingUrl.trim(),
        platform,
        scheduledTime.trim()
      )
      setIsSubmitting(false)
      onCallCreated()
      onClose()
    }, 300)
  }

  return (
    <div className="brand-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="brand-modal-card brand-modal-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-modal-header">
          <div>
            <div className="brand-auth-badge" style={{ marginBottom: '8px' }}>
              <span>●</span> Video Meeting Collaboration
            </div>
            <h2 className="brand-section-title" style={{ fontSize: '22px' }}>
              Drop Video Call Link
            </h2>
            <p className="brand-section-desc">
              Share a Google Meet, Zoom, or Teams video link with the team.
            </p>
          </div>
          <button
            type="button"
            className="brand-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="brand-alert brand-alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="brand-form" onSubmit={handleSubmit} noValidate>
          <div className="brand-field">
            <label htmlFor="call-title" className="brand-label">
              Meeting Topic / Title *
            </label>
            <input
              id="call-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Q3 Strategy & Expense Review Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="brand-input"
            />
          </div>

          <div className="brand-form-grid-2">
            <div className="brand-field">
              <label htmlFor="call-platform" className="brand-label">
                Platform *
              </label>
              <select
                id="call-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as MeetingPlatform)}
                className="brand-select"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="brand-field">
              <label htmlFor="call-schedule" className="brand-label">
                Call Schedule / Timing
              </label>
              <input
                id="call-schedule"
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g. Active Now, or Today 5:00 PM"
                className="brand-input"
              />
            </div>
          </div>

          <div className="brand-field">
            <label htmlFor="call-url" className="brand-label">
              Video Meeting Link (URL) *
            </label>
            <input
              id="call-url"
              name="meetingUrl"
              type="url"
              required
              placeholder="https://meet.google.com/...."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="brand-input"
            />
          </div>

          <div className="brand-field">
            <label htmlFor="call-desc" className="brand-label">
              Short Description / Agenda *
            </label>
            <textarea
              id="call-desc"
              name="description"
              rows={3}
              required
              placeholder="Brief agenda of the call..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="brand-textarea"
            />
          </div>

          <div className="brand-modal-footer">
            <button
              type="button"
              className="brand-btn-secondary brand-btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="brand-btn-cobalt brand-btn-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publishing...' : '📹 Share Meeting Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCallModal
