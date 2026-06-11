import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService.js'
 
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // true on first load

  // On every page load/refresh — check if cookie is still valid
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authService.getMe()
        if (data.success) setUser(data.user)
      } catch {
        setUser(null)  // cookie expired or not set → not logged in
      } finally {
        setLoading(false)  // done checking — show the app
      }
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    if (data.success) setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password)
    if (data.success) setUser(data.user)
    return data
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,  // true if user is not null
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

 
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}