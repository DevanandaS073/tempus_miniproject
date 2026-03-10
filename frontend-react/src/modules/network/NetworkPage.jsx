import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InviteUser from './components/InviteUser';

export default function NetworkPage() {
    const { user, token, hasFeature } = useAuth();
    const [networkUsers, setNetworkUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    useEffect(() => {
        if (token) {
            fetchNetwork();
            if (hasFeature('role:assign')) fetchRoles();
        }
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

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/companies/roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setRoles(data);
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const handleAssignRole = async (targetUserId, newRoleId) => {
        try {
            const res = await fetch(`/api/network/users/${targetUserId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role_id: newRoleId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update role');

            // Update the local list with the new role info
            setNetworkUsers(prev => prev.map(u =>
                u.id === targetUserId ? { ...u, role_id: data.role_id, role: data.role } : u
            ));
            setEditingUserId(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRemoveUser = async (targetUserId, userName) => {
        if (!window.confirm(`Are you sure you want to remove ${userName} from the company?`)) return;
        try {
            const res = await fetch(`/api/companies/users/${targetUserId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove user');
            setNetworkUsers(prev => prev.filter(u => u.id !== targetUserId));
        } catch (err) {
            setError(err.message);
        }
    };

    const canInvite = hasFeature('network:invite_user');
    const canAssignRole = hasFeature('role:assign');
    const canRemove = hasFeature('network:remove_user');

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col h-full w-full pt-20">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white m-0">Company Network</h1>
                    <p className="text-zinc-400 mt-2 m-0 text-sm">Directory of all users attached to this workspace.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 rounded-none flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-white ml-4">×</button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 w-full">
                {/* Directory Grid */}
                <div className="flex-1 bg-white/5 border border-white/5 p-6 h-fit rounded-none">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-wider text-sm m-0">Active Members ({networkUsers.length})</h3>
                        {canInvite && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                className="bg-white text-black hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none"
                            >
                                + Invite User
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-zinc-500 italic text-sm animate-pulse">Loading directory...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {networkUsers.map(u => (
                                <div key={u.id} className="bg-black/20 border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-colors rounded-none">
                                    <div className="w-12 h-12 bg-zinc-800 rounded-none flex items-center justify-center font-bold text-sm uppercase text-zinc-300">
                                        {u.first_name?.charAt(0) || 'U'}{u.last_name?.charAt(0) || ''}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h4 className="text-white font-medium text-sm m-0 leading-tight block">{u.first_name} {u.last_name}</h4>
                                        <span className="text-xs text-zinc-500 mb-1">{u.email}</span>

                                        {/* Role display / editor */}
                                        {canAssignRole && u.id !== user.id && editingUserId === u.id ? (
                                            <select
                                                value={u.role_id || ''}
                                                onChange={(e) => handleAssignRole(u.id, e.target.value)}
                                                onBlur={() => setEditingUserId(null)}
                                                className="mt-1 w-fit bg-zinc-800 border border-zinc-700 text-white text-xs rounded-none px-2 py-1
                                                           focus:outline-none focus:border-zinc-500"
                                                autoFocus
                                            >
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span
                                                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 w-fit rounded-none
                                                    ${u.role?.name === 'admin'
                                                        ? 'text-amber-400 bg-amber-400/10'
                                                        : 'text-orange-400 bg-orange-400/10'}
                                                    ${canAssignRole && u.id !== user.id ? 'cursor-pointer hover:ring-1 hover:ring-zinc-600' : ''}`}
                                                onClick={() => {
                                                    if (canAssignRole && u.id !== user.id) setEditingUserId(u.id);
                                                }}
                                                title={canAssignRole && u.id !== user.id ? 'Click to change role' : ''}
                                            >
                                                {u.role?.name || 'Worker'}
                                                {u.id === user.id && ' (You)'}
                                            </span>
                                        )}
                                    </div>
                                    {canRemove && u.id !== user.id && (
                                        <button
                                            onClick={() => handleRemoveUser(u.id, `${u.first_name} ${u.last_name}`)}
                                            className="ml-auto text-zinc-600 hover:text-red-400 transition-colors p-2 rounded-none hover:bg-red-400/10"
                                            title="Remove from company"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Invite Modal (Feature-gated) */}
                {canInvite && isInviteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="relative w-full max-w-[400px]">
                            <button
                                onClick={() => setIsInviteOpen(false)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10 w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-none font-bold"
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
