import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TopBar from '../../components/TopBar';

export default function FreeAgentPage() {
    const navigate = useNavigate();
    const { user, logout, updateSession } = useAuth();
    const [loadingJoin, setLoadingJoin] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    // Create Company State
    const [isCreating, setIsCreating] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [createError, setCreateError] = useState(null);

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setLoadingCreate(true);
        setCreateError(null);

        try {
            const token = localStorage.getItem('tempus_token');
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: companyName })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to initialize workspace');

            updateSession(data.token, data.user); // Refresh context with new token and company logic
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setCreateError(err.message);
        } finally {
            setLoadingCreate(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const handleJoinCompany = (e) => {
        e.preventDefault();
        setLoadingJoin(true);
        // Placeholder API Call for Phase 3 Join Logic
        setTimeout(() => {
            setLoadingJoin(false);
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white relative flex flex-col items-center overflow-x-hidden">
            <TopBar showLogo={true} />

            {/* Background Animated Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDelay: '1000ms' }}></div>

            <main className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center p-8 z-10 pb-32 mt-8">
                <h1 className="text-4xl md:text-5xl font-light text-slate-200 mb-2">Welcome, {user?.first_name || 'Agent'}.</h1>
                <p className="text-slate-400 text-lg mb-16 text-center max-w-xl">Your workspace is currently unassigned. To access the Tempus platform, you must establish your organizational context.</p>

                <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">

                    {/* Pillar 1: Create Company */}
                    <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-none p-10 flex flex-col items-center justify-between text-center min-h-[400px] shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] transition-shadow">
                        <div>
                            <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/50 rounded-none flex items-center justify-center mx-auto mb-6 text-purple-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold mb-3 text-slate-100">Initialize Workspace</h2>
                            <p className="text-slate-400 mb-8">I am a founder or administrator setting up a new organizational database.</p>
                        </div>

                        {isCreating ? (
                            <form onSubmit={handleCreateCompany} className="w-full flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
                                {createError && <p className="text-red-400 font-mono text-sm uppercase tracking-widest">{createError}</p>}
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Enter Workspace Name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full bg-slate-950 border border-purple-500/50 text-white px-4 py-4 focus:outline-none focus:border-purple-400 transition-colors text-center text-lg tracking-widest rounded-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-light"
                                    required
                                />
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        disabled={loadingCreate}
                                        className="flex-1 py-4 border border-slate-700 hover:border-slate-500 text-slate-400 font-bold tracking-[0.1em] uppercase transition-colors rounded-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loadingCreate || !companyName.trim()}
                                        className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-[0.1em] uppercase transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingCreate ? 'Processing...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-[0.1em] uppercase transition-colors rounded-none"
                            >
                                Configure Hub
                            </button>
                        )}
                    </div>

                    {/* Pillar 2: Join Company */}
                    <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-none p-10 flex flex-col items-center justify-between text-center min-h-[400px]">
                        <div className="w-full">
                            <div className="w-20 h-20 bg-slate-800/50 border border-slate-600 rounded-none flex items-center justify-center mx-auto mb-6 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold mb-3 text-slate-100">Attach to Hub</h2>
                            <p className="text-slate-400 mb-8">I have been explicitly invited by my employer via an organizational access code.</p>
                        </div>

                        <form onSubmit={handleJoinCompany} className="w-full">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="e.g., TECHCORP-123"
                                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-4 mb-4 focus:outline-none focus:border-blue-500 transition-colors text-center text-lg tracking-widest rounded-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-light"
                            />
                            <button
                                type="submit"
                                disabled={joinCode.length < 8 || loadingJoin}
                                className={`w-full py-4 font-bold tracking-[0.1em] uppercase transition-colors rounded-none border 
                  ${joinCode.length >= 8 && !loadingJoin
                                        ? 'bg-blue-600 border-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : 'bg-transparent border-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                {loadingJoin ? 'Validating...' : 'Link Account'}
                            </button>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
}
