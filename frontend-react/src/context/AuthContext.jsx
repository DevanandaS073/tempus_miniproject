import { createContext, useState, useEffect, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)

    // Hydrate from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('tempus_token')
        const savedUser = localStorage.getItem('tempus_user')
        if (savedToken && savedUser) {
            try {
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
            } catch {
                localStorage.removeItem('tempus_token')
                localStorage.removeItem('tempus_user')
            }
        }
    }, [])

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Login failed')

        localStorage.setItem('tempus_token', data.token)
        localStorage.setItem('tempus_user', JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return data.user
    }

    const signup = async (name, email, password, role) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Signup failed')
        return data
    }

    const forgotPassword = async (email) => {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Request failed')
        return data
    }

    const logout = () => {
        localStorage.removeItem('tempus_token')
        localStorage.removeItem('tempus_user')
        localStorage.removeItem('selectedRole')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{
            user, token, isAuthenticated: !!token,
            login, signup, forgotPassword, logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export default AuthContext
