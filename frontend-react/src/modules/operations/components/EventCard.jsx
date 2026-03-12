import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function EventCard({ event, onRefresh, onEdit }) {
    const { token, user, hasFeature } = useAuth();
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [collisionWarning, setCollisionWarning] = useState(null); // { title, start, end }

    const canJoin = hasFeature('event:join');
    const canEdit = hasFeature('event:edit');
    const canDelete = hasFeature('event:delete');
    const canGeneratePoster = hasFeature('event:generate_poster');
    const canGenerateCertificates = hasFeature('event:generate_certificates');
    const isCreator = user?.id === event.created_by;
    const navigate = useNavigate();

    const [media, setMedia] = useState(null);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [showTemplateSelect, setShowTemplateSelect] = useState(false);

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isPastEvent = endDate < new Date();

    // Fetch media status on mount
    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            const [mediaRes, templatesRes] = await Promise.all([
                fetch(`/api/events/${event.event_id}/media`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('/api/events/templates/certificates', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (mediaRes.ok) setMedia(await mediaRes.json());
            if (templatesRes.ok) setTemplates(await templatesRes.json());
        } catch (err) {
            console.error('Failed to fetch media/templates:', err);
        }
    };

    const handleOpenPosterEditor = () => {
        const params = new URLSearchParams({
            eventId: event.event_id,
            mode: 'edit',
            title: event.title || '',
            date: event.start_date || '',
            location: event.location || '',
            description: event.description || ''
        });
        navigate(`/poster-gen?${params.toString()}`);
    };

    const handleViewPoster = () => {
        navigate(`/poster-gen?eventId=${event.event_id}&mode=view`);
    };

    const handleGenerateCertificates = async () => {
        setMediaLoading(true);
        try {
            const res = await fetch(`/api/events/${event.event_id}/media/certificates`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            fetchMedia();
        } catch (err) {
            console.error(err.message);
        } finally {
            setMediaLoading(false);
        }
    };

    const handleSetupAutoCertificates = async (templateId) => {
        setMediaLoading(true);
        try {
            const res = await fetch(`/api/events/${event.event_id}/media/setup-certificates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ template_id: templateId })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            fetchMedia();
            setShowTemplateSelect(false);
        } catch (err) {
            console.error(err.message);
        } finally {
            setMediaLoading(false);
        }
    };

    // ─── Join Event ─────────────────────────────────────────────────────────
    const doJoin = async (force = false) => {
        setActionLoading(true);
        try {
            const url = `/api/events/${event.event_id}/join${force ? '?force=true' : ''}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.status === 409 && data.collision) {
                // Show collision warning — let user decide
                setCollisionWarning(data.collision);
                return;
            }
            if (!res.ok) throw new Error(data.error || 'Failed to join');
            setCollisionWarning(null);
            onRefresh();
        } catch (err) {
            console.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = () => doJoin(false);
    const handleJoinForce = () => doJoin(true);

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

            {/* Media Actions */}
            {media && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/50">
                    {/* Poster — creator: Generate / Edit; others: View (only when completed) */}
                    {isCreator && canGeneratePoster && media.poster_status !== 'completed' && (
                        <button
                            onClick={handleOpenPosterEditor}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold tracking-wider uppercase
                                       hover:bg-purple-500/20 transition-colors"
                        >
                            Generate Poster
                        </button>
                    )}
                    {isCreator && canGeneratePoster && media.poster_status === 'completed' && (
                        <button
                            onClick={handleOpenPosterEditor}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold tracking-wider uppercase
                                       hover:bg-purple-500/20 transition-colors"
                        >
                            Edit Poster
                        </button>
                    )}
                    {!isCreator && media.poster_status === 'completed' && (
                        <button
                            onClick={handleViewPoster}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold tracking-wider uppercase
                                       hover:bg-purple-500/20 transition-colors"
                        >
                            View Poster
                        </button>
                    )}

                    {/* Certificates (Past Event) */}
                    {isPastEvent && canGenerateCertificates && !media.has_certificates && (
                        <button
                            onClick={() => navigate(`/operations/certificates?eventId=${event.event_id}`)}
                            className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold tracking-wider uppercase
                                       hover:bg-amber-500/20 transition-colors"
                        >
                            Award Certificates
                        </button>
                    )}

                    {/* Auto-Certificates Setup (Future Event) */}
                    {!isPastEvent && canGenerateCertificates && !media.has_certificates && (
                        <div className="relative">
                            {event.certificate_template_id ? (
                                <button
                                    onClick={() => setShowTemplateSelect(!showTemplateSelect)}
                                    disabled={mediaLoading}
                                    className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold tracking-wider uppercase
                                               hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                >
                                    ✔ Auto-Cert scheduled
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowTemplateSelect(!showTemplateSelect)}
                                    disabled={mediaLoading}
                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wider uppercase
                                               hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                >
                                    Setup Auto-Certificates
                                </button>
                            )}

                            {showTemplateSelect && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl z-20">
                                    <div className="p-2 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                        Select Template
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {templates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleSetupAutoCertificates(t.id)}
                                                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {media.has_certificates && (
                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase">
                            {media.certificates_count} Certificates
                        </span>
                    )}
                </div>
            )}

            {/* Collision Warning */}
            {collisionWarning && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <p className="font-bold uppercase tracking-wide mb-1">⚠ Schedule Collision</p>
                    <p>This event overlaps with <span className="text-white font-semibold">&ldquo;{collisionWarning.title}&rdquo;</span> you have already joined.</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleJoinForce}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold uppercase tracking-wide hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? '...' : 'Join Anyway'}
                        </button>
                        <button
                            onClick={() => setCollisionWarning(null)}
                            className="px-3 py-1 text-zinc-400 text-xs font-bold uppercase tracking-wide hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
                {/* Join / Leave */}
                {canJoin && (
                    isPastEvent ? (
                        <span className="flex-1 px-4 py-2 bg-zinc-800/50 text-zinc-600 text-xs font-bold tracking-wider uppercase text-center">
                            Event Ended
                        </span>
                    ) : event.isJoined ? (
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
