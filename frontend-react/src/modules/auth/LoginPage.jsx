import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Chronos from './Chronos'
import BlobBackground from '../../components/BlobBackground'
import './auth.css'

/**
 * InputGroup — Extracted OUTSIDE LoginPage to prevent unmount/remount on every render.
 * This fixes the focus-loss bug (issue #1).
 */
function InputGroup({ label, type = 'text', value, onChange, onFocus, onBlur, id, onPasswordToggle }) {
    const isPassword = type === 'password'
    const [showPw, setShowPw] = useState(false)
    const actualType = isPassword && showPw ? 'text' : type

    return (
        <div className="relative group w-full">
            <input
                id={id}
                type={actualType}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder=" "
                className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-400 transition-colors placeholder-transparent shadow-sm"
                autoComplete={isPassword ? 'off' : undefined}
            />
            <label
                htmlFor={id}
                className="absolute left-4 top-2.5 text-zinc-500 text-sm transition-all duration-200
          peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-zinc-300 peer-focus:bg-zinc-900 peer-focus:px-1
          peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-400 peer-[:not(:placeholder-shown)]:bg-zinc-900 peer-[:not(:placeholder-shown)]:px-1
          pointer-events-none"
            >
                {label}
            </label>
            {isPassword && (
                <button
                    type="button"
                    onClick={() => {
                        const nextShow = !showPw
                        setShowPw(nextShow)
                        onPasswordToggle?.(nextShow)
                    }}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
            )}
        </div>
    )
}

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, signup, forgotPassword, isAuthenticated, user } = useAuth()

    const [view, setView] = useState('role') // role | login | signup | forgot
    const [selectedRole, setSelectedRole] = useState(localStorage.getItem('selectedRole') || '')
    const [activeInput, setActiveInput] = useState(null)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form fields
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [forgotEmail, setForgotEmail] = useState('')

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(user.role === 'admin' ? '/dashboard' : '/worker-dashboard', { replace: true })
        }
    }, [isAuthenticated, user, navigate])

    const handleRoleSelect = (role) => {
        setSelectedRole(role)
        localStorage.setItem('selectedRole', role)
        setView('login')
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setLoginFailed(false)
        try {
            const u = await login(loginForm.email, loginForm.password)
            navigate(u.role === 'admin' ? '/dashboard' : '/worker-dashboard', { replace: true })
        } catch (err) {
            setError(err.message)
            setLoginFailed(true)
            setTimeout(() => setLoginFailed(false), 100)
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        setError('')
        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await signup(signupForm.name, signupForm.email, signupForm.password, selectedRole || 'user')
            alert('Account created successfully! Please login.')
            setView('login')
            setSignupForm({ name: '', email: '', password: '', confirmPassword: '' })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleForgot = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const data = await forgotPassword(forgotEmail)
            alert(data.message || 'Password reset instructions sent to your email.')
            setView('login')
            setForgotEmail('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const switchView = useCallback((v) => {
        setView(v)
        setError('')
        setActiveInput(null)
        setPasswordVisible(false)
    }, [])

    // Focus/blur handlers for Chronos eye tracking
    const handleInputFocus = (inputId) => setActiveInput(inputId)
    const handleInputBlur = () => setActiveInput(null)

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <BlobBackground />

            {/* Card — spacious with generous padding */}
            <div className="login-card-enter glass-card w-full max-w-[400px] min-h-[360px] p-5 sm:p-8 relative mx-4 overflow-visible flex flex-col justify-center shadow-2xl">
                {/* Chronos sits on top — z-index BEHIND card content */}
                <Chronos activeInput={activeInput} passwordVisible={passwordVisible} loginFailed={loginFailed} viewState={view} />

                {/* ─── Role Selection ─── */}
                {view === 'role' && (
                    <div className="view-enter text-center">
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome to Tempus</h2>
                        <p className="text-zinc-400 text-sm mb-4">Select your role to continue</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRoleSelect('admin')}
                                className="flex-1 glass-card p-3 text-center cursor-pointer group hover:border-zinc-500 transition-all duration-300 relative overflow-hidden"
                            >
                                <span className="btn-shine" />
                                <i className="fas fa-shield-halved text-3xl text-zinc-300 mb-3 block group-hover:text-white transition-colors" />
                                <span className="text-white font-semibold block">Admin</span>
                                <span className="text-zinc-500 text-xs">Manage events & teams</span>
                            </button>
                            <button
                                onClick={() => handleRoleSelect('user')}
                                className="flex-1 glass-card p-3 text-center cursor-pointer group hover:border-zinc-500 transition-all duration-300 relative overflow-hidden"
                            >
                                <span className="btn-shine" />
                                <i className="fas fa-user text-3xl text-zinc-300 mb-3 block group-hover:text-white transition-colors" />
                                <span className="text-white font-semibold block">Worker</span>
                                <span className="text-zinc-500 text-xs">View schedule & events</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Login ─── */}
                {view === 'login' && (
                    <div className="view-enter">
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome back</h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            Sign in as <span className="capitalize text-zinc-300 font-medium">{selectedRole || 'user'}</span>
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-3">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-3" onSubmit={handleLogin}>
                            <InputGroup label="Email" type="email" id="login-email" value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                onFocus={() => handleInputFocus('login-email')}
                                onBlur={handleInputBlur} />
                            <InputGroup label="Password" type="password" id="login-password" value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-2.5 rounded-xl font-semibold
                  transition-all duration-300 relative overflow-hidden disabled:opacity-50 shadow-md hover:shadow-lg mt-2"
                            >
                                <span className="btn-shine" />
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="flex justify-between mt-4 text-sm">
                            <button onClick={() => switchView('forgot')} className="text-zinc-400 hover:text-white transition-colors">
                                Forgot password?
                            </button>
                            <button onClick={() => switchView('signup')} className="text-zinc-400 hover:text-white transition-colors">
                                Create account
                            </button>
                        </div>
                        <div className="text-center mt-3">
                            <button onClick={() => switchView('role')} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                                ← Change role
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Signup ─── */}
                {view === 'signup' && (
                    <div className="view-enter">
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Create account</h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            Signing up as <span className="capitalize text-zinc-300 font-medium">{selectedRole || 'user'}</span>
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-3">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-2" onSubmit={handleSignup}>
                            <InputGroup label="Full Name" id="signup-name" value={signupForm.name}
                                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                onFocus={() => handleInputFocus('signup-name')}
                                onBlur={handleInputBlur} />
                            <InputGroup label="Email" type="email" id="signup-email" value={signupForm.email}
                                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                onFocus={() => handleInputFocus('signup-email')}
                                onBlur={handleInputBlur} />
                            <InputGroup label="Password" type="password" id="signup-password" value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />
                            <InputGroup label="Confirm Password" type="password" id="signup-confirm" value={signupForm.confirmPassword}
                                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-2.5 rounded-xl font-semibold
                  transition-all duration-300 relative overflow-hidden disabled:opacity-50 shadow-md hover:shadow-lg mt-2"
                            >
                                <span className="btn-shine" />
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <button onClick={() => switchView('login')} className="text-zinc-400 hover:text-white text-sm transition-colors">
                                Already have an account? Sign in
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Forgot Password ─── */}
                {view === 'forgot' && (
                    <div className="view-enter">
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Reset password</h2>
                        <p className="text-zinc-400 text-sm mb-4">Enter your email to receive reset instructions</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-3">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-3" onSubmit={handleForgot}>
                            <InputGroup label="Email" type="email" id="forgot-email" value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                onFocus={() => handleInputFocus('forgot-email')}
                                onBlur={handleInputBlur} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-2.5 rounded-xl font-semibold
                  transition-all duration-300 relative overflow-hidden disabled:opacity-50 shadow-md hover:shadow-lg mt-2"
                            >
                                <span className="btn-shine" />
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <button onClick={() => switchView('login')} className="text-zinc-400 hover:text-white text-sm transition-colors">
                                ← Back to login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
