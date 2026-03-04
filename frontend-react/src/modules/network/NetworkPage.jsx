import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InviteUser from './components/InviteUser'; // Relocating from Settings panel

export default function NetworkPage() {
    const { user, token } = useAuth();
    const [networkUsers, setNetworkUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    useEffect(() => {
        if (token) fetchNetwork();
    }, [token]);

    const fetchNetwork = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/network/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch network');
            setNetworkUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col h-full w-full pt-20">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white m-0">Company Network</h1>
                    <p className="text-zinc-400 mt-2 m-0 text-sm">Directory of all users attached to this workspace.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6">
                    {error}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 w-full">
                {/* Directory Grid */}
                <div className="flex-1 bg-white/5 border border-white/5 p-6 h-fit">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-wider text-sm m-0">Active Members ({networkUsers.length})</h3>
                        {user?.role?.toLowerCase() === 'admin' && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                className="bg-white text-black hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-bold uppercase tracking-wider"
                            >
                                + Invite User
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-zinc-500 italic text-sm">Loading directory...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {networkUsers.map(u => (
                                <div key={u.id} className="bg-black/20 border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                                    <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center font-bold text-sm uppercase text-zinc-300">
                                        {u.first_name?.charAt(0) || 'U'}{u.last_name?.charAt(0) || ''}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-white font-medium text-sm m-0 leading-tight block">{u.first_name} {u.last_name}</h4>
                                        <span className="text-xs text-zinc-500 mb-1">{u.email}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 w-fit">
                                            {u.role?.name || 'Worker'}
                                            {u.id === user.id && ' (You)'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Invite Modal (Admins Only) */}
                {user?.role?.toLowerCase() === 'admin' && isInviteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="relative w-full max-w-[400px]">
                            <button
                                onClick={() => setIsInviteOpen(false)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-700 font-bold"
                            >
                                ✕
                            </button>
                            <InviteUser />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
