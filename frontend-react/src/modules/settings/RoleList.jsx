import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleList() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ─── Fetch all company roles on mount ───────────────────────────────────
    useEffect(() => {
        const loadRoles = async () => {
            try {
                const res = await fetch('/api/companies/roles', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load roles');
                const data = await res.json();
                setRoles(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadRoles();
    }, [token]);

    // ─── Delete a role ──────────────────────────────────────────────────────
    const handleDelete = async (roleId) => {
        try {
            const res = await fetch(`/api/companies/roles/${roleId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete role');
            setRoles(prev => prev.filter(r => r.id !== roleId));
            setDeleteConfirm(null);
        } catch (err) {
            setError(err.message);
            setDeleteConfirm(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-zinc-500 font-mono text-sm tracking-widest uppercase animate-pulse">
                    Loading Roles...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Role Manager</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {roles.length} role{roles.length !== 1 ? 's' : ''} configured for your workspace
                    </p>
                </div>
                <button
                    onClick={() => navigate('/settings/roles/new')}
                    className="px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase
                               rounded-none hover:bg-zinc-200 transition-all"
                >
                    + New Role
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-none text-red-400 text-sm">
                    {error}
                    <button onClick={() => setError('')} className="ml-4 text-red-300 hover:text-white">×</button>
                </div>
            )}

            {/* Role Cards */}
            <div className="space-y-4">
                {roles.map(role => {
                    const isAdmin = role.name === 'admin';
                    const isDeleting = deleteConfirm === role.id;

                    return (
                        <div
                            key={role.id}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-none p-5 flex items-center justify-between
                                       hover:border-zinc-700 transition-colors"
                        >
                            {/* Left: Name + Feature Count */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-white font-bold text-base capitalize">{role.name}</h3>
                                    {isAdmin && (
                                        <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5
                                                         bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-none">
                                            System
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-500 text-xs mt-1 font-mono">
                                    {role.features?.length || 0} feature{(role.features?.length || 0) !== 1 ? 's' : ''} assigned
                                </p>

                                {/* Feature Pills Preview */}
                                {role.features && role.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {role.features.slice(0, 6).map(f => (
                                            <span
                                                key={f.code}
                                                className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400
                                                           rounded-none border border-zinc-700"
                                            >
                                                {f.code}
                                            </span>
                                        ))}
                                        {role.features.length > 6 && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 text-zinc-500">
                                                +{role.features.length - 6} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2 ml-4">
                                {!isAdmin && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/settings/roles/edit/${role.id}`)}
                                            className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold tracking-wider uppercase
                                                       rounded-none hover:bg-zinc-700 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </button>

                                        {isDeleting ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold tracking-wider uppercase
                                                               rounded-none hover:bg-red-500/30 transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-3 py-2 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(role.id)}
                                                className="px-4 py-2 bg-zinc-800 text-zinc-500 text-xs font-bold tracking-wider uppercase
                                                           rounded-none hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
                                                           transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </>
                                )}
                                {isAdmin && (
                                    <span className="text-zinc-600 text-xs font-mono tracking-wider uppercase">
                                        Protected
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {roles.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-zinc-500 text-sm">No roles configured yet.</p>
                        <button
                            onClick={() => navigate('/settings/roles/new')}
                            className="mt-4 text-white text-xs font-bold tracking-wider uppercase underline hover:no-underline"
                        >
                            Create your first role
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
