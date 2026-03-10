import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
    const { user, token, hasFeature, logout } = useAuth();
    const navigate = useNavigate();
    const [companyInfo, setCompanyInfo] = useState({ name: '', subdomain: '' });
    const [profileInfo, setProfileInfo] = useState({ first_name: '', last_name: '', email: '' });

    const [companyLoading, setCompanyLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const [companyMessage, setCompanyMessage] = useState(null);
    const [profileMessage, setProfileMessage] = useState(null);

    const canEditCompany = hasFeature('company:update_info') || user.role === 'admin';

    useEffect(() => {
        // Pre-fill profile info from context
        if (user) {
            setProfileInfo({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || ''
            });
        }

        // Fetch company info
        if (token) {
            fetchCompany();
        }
    }, [user, token]);

    const fetchCompany = async () => {
        try {
            const res = await fetch('/api/companies/current', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCompanyInfo({ name: data.name || '', subdomain: data.subdomain || '' });
            } else {
                setCompanyMessage({ type: 'error', text: data.error || 'Failed to load company info' });
            }
        } catch (err) {
            setCompanyMessage({ type: 'error', text: 'Error connecting to server' });
        } finally {
            setCompanyLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);

        // Construct the full name the backend expects
        const fullName = `${profileInfo.first_name.trim()} ${profileInfo.last_name.trim()}`;

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: fullName })
            });

            const data = await res.json();
            if (res.ok) {
                setProfileMessage({ type: 'success', text: 'Profile updated successfully. Refresh to see changes globally.' });
            } else {
                setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (err) {
            setProfileMessage({ type: 'error', text: 'Error connecting to server' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        setCompanyLoading(true);
        setCompanyMessage(null);

        try {
            const res = await fetch('/api/companies/current', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: companyInfo.name })
            });

            const data = await res.json();
            if (res.ok) {
                setCompanyMessage({ type: 'success', text: 'Company updated successfully.' });
                setCompanyInfo(prev => ({ ...prev, name: data.company.name }));
            } else {
                setCompanyMessage({ type: 'error', text: data.error || 'Failed to update company' });
            }
        } catch (err) {
            setCompanyMessage({ type: 'error', text: 'Error connecting to server' });
        } finally {
            setCompanyLoading(false);
        }
    };

    const handleLeaveCompany = async () => {
        if (!window.confirm('Are you sure you want to leave this workspace? You will lose access to all company data.')) return;
        if (!window.confirm('This action is IRREVERSIBLE. Are you absolutely sure?')) return;

        try {
            const res = await fetch('/api/companies/leave', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to leave company');
            logout();
            navigate('/', { replace: true });
        } catch (err) {
            setCompanyMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col h-full w-full pt-20">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
            <p className="text-zinc-400 text-sm mb-12">Manage your personal profile and workspace configurations.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ─── Personal Profile Card ──────────────────────────────── */}
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-none h-fit">
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">
                        Personal Profile
                    </h2>

                    {profileMessage && (
                        <div className={`p-4 mb-6 text-sm border ${profileMessage.type === 'error' ? 'bg-red-950/30 border-red-900 text-red-400' : 'bg-emerald-950/30 border-emerald-900 text-emerald-400'}`}>
                            {profileMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={profileInfo.first_name}
                                    onChange={(e) => setProfileInfo(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 focus:outline-none focus:border-zinc-500 transition-colors rounded-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={profileInfo.last_name}
                                    onChange={(e) => setProfileInfo(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 focus:outline-none focus:border-zinc-500 transition-colors rounded-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address (Read-only)</label>
                            <input
                                type="email"
                                value={profileInfo.email}
                                disabled
                                className="w-full bg-zinc-950 border border-zinc-800/50 text-zinc-500 p-3 items-center rounded-none cursor-not-allowed"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="bg-white text-black hover:bg-zinc-200 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {profileLoading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ─── Workspace Setting Card ─────────────────────────────── */}
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-none h-fit">
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">
                        Workspace
                    </h2>

                    {companyMessage && (
                        <div className={`p-4 mb-6 text-sm border ${companyMessage.type === 'error' ? 'bg-red-950/30 border-red-900 text-red-400' : 'bg-emerald-950/30 border-emerald-900 text-emerald-400'}`}>
                            {companyMessage.text}
                        </div>
                    )}

                    {companyLoading ? (
                        <div className="text-zinc-500 italic text-sm animate-pulse">Loading workspace details...</div>
                    ) : (
                        <form onSubmit={handleCompanySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Name</label>
                                <input
                                    type="text"
                                    value={companyInfo.name}
                                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={!canEditCompany}
                                    className={`w-full bg-zinc-900 border border-zinc-800 text-white p-3 focus:outline-none focus:border-zinc-500 transition-colors rounded-none ${!canEditCompany && 'opacity-70 cursor-not-allowed'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subdomain (Read-only)</label>
                                <div className="flex">
                                    <span className="bg-zinc-950 border border-r-0 border-zinc-800/50 text-zinc-600 p-3 text-sm">https://</span>
                                    <input
                                        type="text"
                                        value={companyInfo.subdomain}
                                        disabled
                                        className="w-full bg-zinc-950 border border-zinc-800/50 text-zinc-500 p-3 items-center rounded-none cursor-not-allowed"
                                    />
                                    <span className="bg-zinc-950 border border-l-0 border-zinc-800/50 text-zinc-600 p-3 text-sm">.miniproject.com</span>
                                </div>
                                <p className="text-zinc-600 text-xs mt-2">The subdomain cannot be changed once created.</p>
                            </div>

                            {canEditCompany && (
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={companyLoading}
                                        className="bg-zinc-800 text-white hover:bg-zinc-700 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 hover:border-zinc-500"
                                    >
                                        {companyLoading ? 'Saving...' : 'Save Workspace'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>

            </div>

            {/* ─── Danger Zone: Leave Workspace ──────────────────────── */}
            <div className="mt-12 bg-red-950/20 border border-red-900/30 p-6 rounded-none">
                <h2 className="text-lg font-bold text-red-400 uppercase tracking-widest mb-2">
                    Danger Zone
                </h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Leaving the workspace will immediately revoke your access to all company data, events, and meetings. This action cannot be undone.
                </p>
                <button
                    onClick={handleLeaveCompany}
                    className="bg-red-900/30 text-red-400 hover:bg-red-900/60 hover:text-red-300 border border-red-900/50 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    Leave Workspace
                </button>
            </div>

        </div>
    );
}
