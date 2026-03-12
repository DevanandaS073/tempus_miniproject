import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ showLogo = false }) {
    const { user, logout, updateSession } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // Notification State
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isAccepting, setIsAccepting] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadError, setDownloadError] = useState(null);

    const token = () => localStorage.getItem('tempus_token');

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (res.ok) setNotifications(await res.json());
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }, [user]);

    // Poll every 8 s; also fire immediately when the panel opens
    useEffect(() => {
        fetchNotifications();
        const id = setInterval(fetchNotifications, 8000);
        return () => clearInterval(id);
    }, [fetchNotifications]);

    useEffect(() => {
        if (notificationsOpen) fetchNotifications();
    }, [notificationsOpen, fetchNotifications]);

    // --- handlers ---

    const handleDelete = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token()}` }
        }).catch(err => console.error('Failed to delete notification', err));
    };

    const handleAcceptInvite = async (notificationId) => {
        setIsAccepting(true);
        try {
            const res = await fetch(`/api/invites/accept/${notificationId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to accept invite');
            updateSession(data.token, data.user);
            setNotificationsOpen(false);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            alert(err.message);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDeclineInvite = async (notificationId) => {
        try {
            const res = await fetch(`/api/invites/decline/${notificationId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to decline invite');
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDownloadCert = async (n) => {
        setDownloadingId(n.id);
        setDownloadError(null);
        try {
            const res = await fetch(n.link, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Server error ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cd = res.headers.get('Content-Disposition') || '';
            const match = cd.match(/filename="?([^"]+)"?/);
            a.download = match ? match[1] : 'certificate.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            handleDelete(n.id); // auto-dismiss after download
        } catch (err) {
            console.error('Certificate download error:', err);
            setDownloadError({ id: n.id, msg: err.message });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <header className="w-full h-16 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-20 rounded-none shrink-0 sticky top-0">
            <div className="flex-1">
                {showLogo && (
                    <div className="font-bold text-2xl tracking-[0.2em] text-white">TEMPUS</div>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => { setNotificationsOpen(v => !v); setMenuOpen(false); }}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 relative"
                        title="Notifications"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="square" strokeLinejoin="miter" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-700 shadow-2xl z-[60] flex flex-col">
                            <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Notifications
                                    {notifications.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-slate-400">({notifications.length})</span>
                                    )}
                                </h3>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-400 text-center italic">No new notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 text-base shrink-0">
                                                    {n.type === 'INVITE' ? '✉️'
                                                        : n.type === 'certificate_issued' ? '🎓'
                                                        : '🔔'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {/* Title row with × button */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-semibold text-slate-200 leading-snug">{n.title}</h4>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                                            title="Dismiss"
                                                            className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-slate-700 hover:bg-red-500 border border-slate-600 hover:border-red-400 text-slate-400 hover:text-white transition-colors flex items-center justify-center text-xs leading-none"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    <p className="text-xs text-slate-400 mt-1 leading-snug">{n.message}</p>
                                                    <p className="text-[10px] text-slate-600 mt-1">
                                                        {new Date(n.created_at).toLocaleString()}
                                                    </p>

                                                    {/* INVITE actions */}
                                                    {n.type === 'INVITE' && (
                                                        <div className="mt-3 flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAcceptInvite(n.id)}
                                                                disabled={isAccepting}
                                                                className="flex-1 bg-white text-black hover:bg-slate-200 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                                                            >
                                                                {isAccepting ? '...' : 'Accept'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeclineInvite(n.id)}
                                                                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-800 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Certificate download */}
                                                    {n.type === 'certificate_issued' && n.link && (
                                                        <div className="mt-3">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadCert(n); }}
                                                                disabled={downloadingId === n.id}
                                                                className="w-full bg-violet-700 hover:bg-violet-600 disabled:bg-violet-900 text-white py-1.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                {downloadingId === n.id ? (
                                                                    <><span className="animate-spin">⟳</span> Downloading…</>
                                                                ) : (
                                                                    <>⬇ Download Certificate</>
                                                                )}
                                                            </button>
                                                            {downloadError?.id === n.id && (
                                                                <p className="text-[10px] text-red-400 mt-1">⚠ {downloadError.msg}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative cursor-pointer" onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }}>
                    <div className="w-10 h-10 bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm uppercase hover:bg-slate-700 transition-colors">
                        {user?.first_name?.charAt(0) || 'U'}{user?.last_name?.charAt(0) || ''}
                    </div>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 flex flex-col bg-slate-900 border border-slate-700 shadow-2xl py-1 z-[60]">
                            <button className="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium tracking-wide">⚙️ Account Settings</button>
                            <button onClick={handleLogout} className="px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-slate-800 font-medium tracking-wide">🚪 Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
    