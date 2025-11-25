import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error loading user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const foundUser = users.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      const userData = { ...foundUser }
      delete userData.password
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const register = (email, password, name) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'User with this email already exists' }
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      createdAt: new Date().toISOString()
    }

    users.push({ ...newUser, password })
    localStorage.setItem('users', JSON.stringify(users))

    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
