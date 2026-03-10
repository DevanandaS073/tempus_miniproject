import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── The 24 Platform Features, grouped by module ────────────────────────────
const FEATURE_GROUPS = [
    {
        label: 'Calendar & Meetings',
        features: [
            { code: 'calendar:view', name: 'View Calendar' },
            { code: 'meeting:create', name: 'Schedule Meetings' },
            { code: 'meeting:edit_own', name: 'Edit Own Meetings' },
            { code: 'meeting:edit_any', name: 'Edit Any Meeting' },
            { code: 'meeting:delete_own', name: 'Cancel Own Meetings' },
            { code: 'meeting:delete_any', name: 'Cancel Any Meeting' },
        ]
    },
    {
        label: 'Events & Operations',
        features: [
            { code: 'event:view', name: 'View Operations' },
            { code: 'event:join', name: 'RSVP to Events' },
            { code: 'event:create', name: 'Create Operations' },
            { code: 'event:edit', name: 'Edit Operations' },
            { code: 'event:delete', name: 'Cancel Operations' },
            { code: 'event:generate_poster', name: 'Generate AI Posters' },
            { code: 'event:generate_certificates', name: 'Generate Certificates' },
        ]
    },
    {
        label: 'Network & Directory',
        features: [
            { code: 'network:view', name: 'View Directory' },
            { code: 'network:invite_user', name: 'Send Invites' },
            { code: 'network:remove_user', name: 'Remove Users' },
        ]
    },
    {
        label: 'Admin Settings & Roles',
        features: [
            { code: 'admin:view_settings', name: 'Access Settings' },
            { code: 'role:create', name: 'Create Custom Roles' },
            { code: 'role:edit', name: 'Edit Custom Roles' },
            { code: 'role:delete', name: 'Delete Custom Roles' },
            { code: 'role:assign', name: 'Promote/Demote Users' },
            { code: 'company:update_info', name: 'Modify Identity' },
        ]
    },
    {
        label: 'Reports & Analytics',
        features: [
            { code: 'reports:personal', name: 'View Personal Stats' },
            { code: 'reports:company', name: 'View Global Stats' },
            { code: 'reports:export', name: 'Export Analytics' },
        ]
    }
];

export default function RoleBuilder() {
    const { id } = useParams(); // If present, we're in edit mode
    const navigate = useNavigate();
    const { token } = useAuth();

    const [roleName, setRoleName] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEditMode = !!id;

    // ─── Load existing role data if in Edit Mode ────────────────────────────
    useEffect(() => {
        if (!isEditMode) return;

        const loadRole = async () => {
            try {
                const res = await fetch(`/api/companies/roles/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load role');
                const data = await res.json();
                setRoleName(data.name);
                setSelectedFeatures(data.features.map(f => f.code));
            } catch (err) {
                setError(err.message);
            }
        };
        loadRole();
    }, [id, token, isEditMode]);

    // ─── Toggle a feature checkbox ──────────────────────────────────────────
    const toggleFeature = (code) => {
        setSelectedFeatures(prev =>
            prev.includes(code)
                ? prev.filter(f => f !== code)
                : [...prev, code]
        );
    };

    // ─── Select/deselect all features in a group ────────────────────────────
    const toggleGroup = (group) => {
        const codes = group.features.map(f => f.code);
        const allSelected = codes.every(c => selectedFeatures.includes(c));

        if (allSelected) {
            setSelectedFeatures(prev => prev.filter(f => !codes.includes(f)));
        } else {
            setSelectedFeatures(prev => [...new Set([...prev, ...codes])]);
        }
    };

    // ─── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!roleName.trim()) {
            setError('Role name is required');
            return;
        }
        if (selectedFeatures.length === 0) {
            setError('Select at least one feature');
            return;
        }

        setLoading(true);

        try {
            const url = isEditMode
                ? `/api/companies/roles/${id}`
                : '/api/companies/roles';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: roleName, features: selectedFeatures })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save role');

            setSuccess(isEditMode ? 'Role updated successfully!' : 'Role created successfully!');
            setTimeout(() => navigate('/settings/roles'), 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                        {isEditMode ? 'Edit Role' : 'Create New Role'}
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {isEditMode
                            ? 'Modify the permissions for this role'
                            : 'Define a new role by selecting the features it can access'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/settings/roles')}
                    className="text-zinc-500 hover:text-zinc-300 text-sm font-mono tracking-wider uppercase transition-colors"
                >
                    ← Back
                </button>
            </div>

            {/* Feedback */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-none text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-none text-emerald-400 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Role Name Input */}
                <div className="mb-8">
                    <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                        Role Name
                    </label>
                    <input
                        type="text"
                        value={roleName}
                        onChange={e => setRoleName(e.target.value)}
                        placeholder="e.g. Senior Engineer, Marketing Lead..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-none px-4 py-3 text-white
                                   placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                </div>

                {/* Feature Grid */}
                <div className="space-y-6">
                    {FEATURE_GROUPS.map(group => {
                        const allSelected = group.features.every(f => selectedFeatures.includes(f.code));
                        const someSelected = group.features.some(f => selectedFeatures.includes(f.code));

                        return (
                            <div key={group.label} className="bg-zinc-900/50 border border-zinc-800 rounded-none p-5">
                                {/* Group Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-bold text-sm tracking-wider uppercase">
                                        {group.label}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group)}
                                        className={`text-xs font-mono tracking-wider uppercase px-3 py-1 rounded-none transition-colors
                                            ${allSelected
                                                ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'}`}
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {/* Feature Checkboxes */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {group.features.map(feature => (
                                        <label
                                            key={feature.code}
                                            className={`flex items-center gap-3 p-3 rounded-none cursor-pointer transition-all
                                                ${selectedFeatures.includes(feature.code)
                                                    ? 'bg-white/5 border border-white/10'
                                                    : 'bg-transparent border border-transparent hover:bg-zinc-800'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFeatures.includes(feature.code)}
                                                onChange={() => toggleFeature(feature.code)}
                                                className="w-4 h-4 rounded-none border-zinc-600 bg-zinc-800 text-white
                                                           focus:ring-0 focus:ring-offset-0 accent-white"
                                            />
                                            <div>
                                                <div className="text-sm text-white font-medium">{feature.name}</div>
                                                <div className="text-[11px] text-zinc-500 font-mono">{feature.code}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Bar */}
                <div className="mt-8 flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-none p-5">
                    <div className="text-zinc-400 text-sm">
                        <span className="text-white font-bold">{selectedFeatures.length}</span> / 24 features selected
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-white text-black font-bold text-sm tracking-wider uppercase
                                   rounded-none hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading
                            ? 'Saving...'
                            : isEditMode ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </form>
        </div>
    );
}
