import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Chronos from './Chronos'
import BlobBackground from '../../components/BlobBackground'
import './auth.css'

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
                className="peer w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white text-sm outline-none focus:border-zinc-400 focus:bg-white/10 transition-all placeholder-transparent shadow-none"
                autoComplete={isPassword ? 'off' : undefined}
            />
            <label
                htmlFor={id}
                className="absolute left-4 top-3 text-zinc-500 text-sm transition-all duration-200
          peer-focus:top-[-8px] peer-focus:text-xs peer-focus:text-white peer-focus:bg-zinc-950 peer-focus:px-2
          peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-white peer-[:not(:placeholder-shown)]:bg-zinc-950 peer-[:not(:placeholder-shown)]:px-2
          pointer-events-none tracking-widest uppercase"
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
                    className="absolute right-4 top-3 text-zinc-500 hover:text-white transition-colors"
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

    const [view, setView] = useState('login') // login | signup | forgot
    const [activeInput, setActiveInput] = useState(null)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form fields
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [forgotEmail, setForgotEmail] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setLoginFailed(false)
        try {
            const u = await login(loginForm.email, loginForm.password)
            navigate(u.company_id ? '/dashboard' : '/limbo', { replace: true })
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
            await signup(signupForm.name, signupForm.email, signupForm.password)
            // Auto-login immediately after successful signup
            const u = await login(signupForm.email, signupForm.password)
            navigate(u.company_id ? '/dashboard' : '/limbo', { replace: true })
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950 font-sans">
            <BlobBackground />

            {/* Brutalist Card */}
            <div className="login-card-enter bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 w-full max-w-[420px] min-h-[400px] p-8 sm:p-10 relative mx-4 flex flex-col justify-center rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
                <Chronos activeInput={activeInput} passwordVisible={passwordVisible} loginFailed={loginFailed} viewState={view} />

                {/* ─── Login ─── */}
                {view === 'login' && (
                    <div className="view-enter">
                        <h2 className="text-3xl font-light text-white mb-2 tracking-[0.1em] uppercase">Authenticate</h2>
                        <p className="text-zinc-500 text-sm mb-8 tracking-widest uppercase">Identity Verification</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-none px-4 py-3 mb-6 uppercase tracking-wider font-bold">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                            <InputGroup label="Email Address" type="email" id="login-email" value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                onFocus={() => handleInputFocus('login-email')}
                                onBlur={handleInputBlur} />

                            <InputGroup label="Access Token" type="password" id="login-password" value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-none font-bold uppercase tracking-[0.2em]
                  transition-all duration-300 disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                            >
                                {loading ? 'Processing...' : 'Enter System'}
                            </button>
                        </form>

                        <div className="flex justify-between mt-8 text-xs font-bold tracking-widest uppercase">
                            <button onClick={() => switchView('forgot')} className="text-zinc-500 hover:text-white transition-colors">
                                Reset Key
                            </button>
                            <button onClick={() => switchView('signup')} className="text-zinc-500 hover:text-white transition-colors">
                                Initialize Agent
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Signup ─── */}
                {view === 'signup' && (
                    <div className="view-enter">
                        <h2 className="text-3xl font-light text-white mb-2 tracking-[0.1em] uppercase">Initialize</h2>
                        <p className="text-zinc-500 text-sm mb-8 tracking-widest uppercase">Register New Agent</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-none px-4 py-3 mb-6 uppercase tracking-wider font-bold">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-5" onSubmit={handleSignup}>
                            <InputGroup label="Full Name" id="signup-name" value={signupForm.name}
                                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                                onFocus={() => handleInputFocus('signup-name')}
                                onBlur={handleInputBlur} />
                            <InputGroup label="Email Address" type="email" id="signup-email" value={signupForm.email}
                                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                onFocus={() => handleInputFocus('signup-email')}
                                onBlur={handleInputBlur} />
                            <InputGroup label="Master Key" type="password" id="signup-password" value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />
                            <InputGroup label="Verify Key" type="password" id="signup-confirm" value={signupForm.confirmPassword}
                                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                onFocus={() => handleInputFocus('password')}
                                onBlur={handleInputBlur}
                                onPasswordToggle={(visible) => setPasswordVisible(visible)} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-none font-bold uppercase tracking-[0.2em]
                  transition-all duration-300 disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </form>

                        <div className="text-center mt-6 text-xs font-bold tracking-widest uppercase">
                            <button onClick={() => switchView('login')} className="text-zinc-500 hover:text-white transition-colors">
                                ← Return to Gateway
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Forgot Password ─── */}
                {view === 'forgot' && (
                    <div className="view-enter">
                        <h2 className="text-3xl font-light text-white mb-2 tracking-[0.1em] uppercase">Override</h2>
                        <p className="text-zinc-500 text-sm mb-8 tracking-widest uppercase">Request Key Reset</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-none px-4 py-3 mb-6 uppercase tracking-wider font-bold">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-6" onSubmit={handleForgot}>
                            <InputGroup label="Email Address" type="email" id="forgot-email" value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                onFocus={() => handleInputFocus('forgot-email')}
                                onBlur={handleInputBlur} />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-none font-bold uppercase tracking-[0.2em]
                  transition-all duration-300 disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                            >
                                {loading ? 'Processing...' : 'Transmit Override'}
                            </button>
                        </form>

                        <div className="text-center mt-8 text-xs font-bold tracking-widest uppercase">
                            <button onClick={() => switchView('login')} className="text-zinc-500 hover:text-white transition-colors">
                                ← Abort Protocol
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
