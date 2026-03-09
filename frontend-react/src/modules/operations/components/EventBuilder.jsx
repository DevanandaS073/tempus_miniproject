import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function EventBuilder({ event, onClose, onSaved }) {
    const { token } = useAuth();
    const isEditMode = !!event;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'general',
        start_date: '',
        end_date: '',
        location: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill in edit mode
    useEffect(() => {
        if (event) {
            const toLocalDatetime = (d) => {
                const dt = new Date(d);
                return dt.toISOString().slice(0, 16);
            };
            setFormData({
                title: event.title || '',
                description: event.description || '',
                event_type: event.event_type || 'general',
                start_date: toLocalDatetime(event.start_date),
                end_date: toLocalDatetime(event.end_date),
                location: event.location || ''
            });
        }
    }, [event]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) return setError('Title is required');
        if (!formData.start_date) return setError('Start date is required');
        if (!formData.end_date) return setError('End date is required');

        setLoading(true);
        try {
            const url = isEditMode
                ? `/api/events/${event.event_id}`
                : '/api/events';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save event');

            onSaved?.();
            onClose?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const eventTypes = ['general', 'conference', 'workshop', 'social', 'training', 'meeting', 'hackathon'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 p-6">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors
                               w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-700 font-bold"
                >
                    ✕
                </button>

                {/* Header */}
                <h2 className="text-xl font-bold text-white tracking-wide mb-1">
                    {isEditMode ? 'Edit Operation' : 'Create Operation'}
                </h2>
                <p className="text-zinc-500 text-xs mb-6">
                    {isEditMode ? 'Modify the details of this event.' : 'Schedule a new operation for your workspace.'}
                </p>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Title */}
                    <div>
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g. Q1 Strategy Meeting"
                            className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm
                                       placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Type</label>
                        <select
                            value={formData.event_type}
                            onChange={(e) => handleChange('event_type', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm
                                       focus:outline-none focus:border-zinc-600 transition-colors"
                            style={{ colorScheme: 'dark' }}
                        >
                            {eventTypes.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Start</label>
                            <input
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={(e) => handleChange('start_date', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                                           focus:outline-none focus:border-zinc-600 transition-colors"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">End</label>
                            <input
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={(e) => handleChange('end_date', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                                           focus:outline-none focus:border-zinc-600 transition-colors"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g. Conference Room A, Virtual"
                            className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm
                                       placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1.5">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Optional details about this operation..."
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-white text-sm
                                       placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 px-6 py-3 bg-white text-black font-bold text-xs tracking-wider uppercase
                                   hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update Operation' : 'Create Operation'}
                    </button>
                </form>
            </div>
        </div>
    );
}
