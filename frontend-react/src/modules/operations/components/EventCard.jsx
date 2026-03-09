import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function EventCard({ event, onRefresh, onEdit }) {
    const { token, user, hasFeature } = useAuth();
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const canJoin = hasFeature('event:join');
    const canEdit = hasFeature('event:edit');
    const canDelete = hasFeature('event:delete');

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // ─── Join Event ─────────────────────────────────────────────────────────
    const handleJoin = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/events/${event.event_id}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to join');
            }
            onRefresh();
        } catch (err) {
            console.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Leave Event ────────────────────────────────────────────────────────
    const handleLeave = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/events/${event.event_id}/join`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to leave');
            }
            onRefresh();
        } catch (err) {
            console.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Delete Event ───────────────────────────────────────────────────────
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/events/${event.event_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            onRefresh();
        } catch (err) {
            console.error(err.message);
        } finally {
            setActionLoading(false);
            setDeleteConfirm(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 flex flex-col gap-3
                        hover:border-zinc-700 transition-colors group">
            {/* Header: Type Badge + Date */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5
                                 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {event.event_type}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                    {formatDate(startDate)}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-base leading-tight">{event.title}</h3>

            {/* Description preview */}
            {event.description && (
                <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{event.description}</p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 font-mono mt-auto pt-2 border-t border-zinc-800/50">
                <span>⏱ {formatTime(startDate)} – {formatTime(endDate)}</span>
                {event.location && <span>📍 {event.location}</span>}
                <span>👥 {event.participantCount || 0} joined</span>
            </div>

            {/* Creator */}
            {event.creator && (
                <div className="text-[10px] text-zinc-600 font-mono">
                    Created by {event.creator.first_name} {event.creator.last_name}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
                {/* Join / Leave */}
                {canJoin && (
                    event.isJoined ? (
                        <button
                            onClick={handleLeave}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold tracking-wider uppercase
                                       hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? '...' : 'Leave'}
                        </button>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-2 bg-white text-black text-xs font-bold tracking-wider uppercase
                                       hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? '...' : 'Join Operation'}
                        </button>
                    )
                )}

                {/* Edit */}
                {canEdit && onEdit && (
                    <button
                        onClick={() => onEdit(event)}
                        className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold tracking-wider uppercase
                                   hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                        Edit
                    </button>
                )}

                {/* Delete */}
                {canDelete && (
                    deleteConfirm ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-3 py-2 bg-red-500/20 text-red-400 text-xs font-bold tracking-wider uppercase
                                           hover:bg-red-500/30 transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="px-2 py-2 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="px-3 py-2 bg-zinc-800 text-zinc-500 text-xs font-bold tracking-wider uppercase
                                       hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            Delete
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
