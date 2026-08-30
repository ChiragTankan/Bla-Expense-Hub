import React from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <div className="notfound-badge">404</div>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-description">
          Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
        </p>
        <div className="notfound-actions">
          <Link to="/login" className="notfound-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="btn-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
