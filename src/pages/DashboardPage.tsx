import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AdminDashboardPage } from './AdminDashboardPage'
import { EmployeeDashboardPage } from './EmployeeDashboardPage'

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboardPage currentUser={currentUser} />
  }

  return <EmployeeDashboardPage currentUser={currentUser} />
}

export default DashboardPage
