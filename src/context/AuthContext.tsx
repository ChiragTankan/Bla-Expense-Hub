import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'
import storageService from '../services/storageService'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => void
  isAdmin: boolean
  isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storageService.getActiveSessionUser()
  })

  useEffect(() => {
    // If no user is logged in, default check session
    const sessionUser = storageService.getActiveSessionUser()
    if (sessionUser && !currentUser) {
      setCurrentUser(sessionUser)
    }
  }, [currentUser])

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const user = await storageService.login(email, password)
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials. Please verify your email and password.',
      }
    }
    setCurrentUser(user)
    return { success: true }
  }

  const logout = () => {
    storageService.setActiveSessionUser(null)
    setCurrentUser(null)
  }

  const refreshUser = () => {
    const updated = storageService.getActiveSessionUser()
    setCurrentUser(updated)
  }

  const isAdmin = currentUser?.role === 'admin'
  const isEmployee = currentUser?.role === 'employee'

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        refreshUser,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
