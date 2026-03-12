import { useState, useEffect, useRef, useCallback } from 'react'

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [downloadingId, setDownloadingId] = useState(null)
    const [downloadError, setDownloadError] = useState(null)
    const dropdownRef = useRef(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('tempus_token')
            if (!token) return
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) setNotifications(await res.json())
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }, [])

    // Poll every 8 seconds
    useEffect(() => {
        fetchNotifications()
        const id = setInterval(fetchNotifications, 8000)
        return () => clearInterval(id)
    }, [fetchNotifications])

    // Refresh immediately whenever the dropdown is opened
    useEffect(() => {
        if (isOpen) fetchNotifications()
    }, [isOpen, fetchNotifications])

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const token = () => localStorage.getItem('tempus_token')

    // Optimistic delete — removes immediately from UI, fires DELETE in background
    const handleDelete = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token()}` }
        }).catch(err => console.error('Failed to delete notification', err))
    }

    const handleMarkAllRead = async () => {
        await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token()}` }
        })
        fetchNotifications()
    }

    const handleClearAll = async () => {
        await fetch('/api/notifications/clear', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token()}` }
        })
        setNotifications([])
    }

    const handleDownloadCert = async (notification) => {
        setDownloadingId(notification.id)
        setDownloadError(null)
        try {
            const res = await fetch(notification.link, {
                headers: { 'Authorization': `Bearer ${token()}` }
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `Server error ${res.status}`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // Try to pull filename from Content-Disposition header
            const cd = res.headers.get('Content-Disposition') || ''
            const match = cd.match(/filename="?([^"]+)"?/)
            a.download = match ? match[1] : 'certificate.pdf'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            // Dismiss the notification after successful download
            handleDelete(notification.id)
        } catch (err) {
            console.error('Certificate download error:', err)
            setDownloadError({ id: notification.id, msg: err.message })
        } finally {
            setDownloadingId(null)
        }
    }

    const unreadCount = notifications.length

    const iconFor = (type) => {
        if (type === 'certificate_issued') return 'fa-certificate'
        if (type === 'event_created')      return 'fa-calendar-star'
        if (type === 'meeting_invite')     return 'fa-handshake'
        return 'fa-circle-info'
    }
    const colorFor = (type) => {
        if (type === 'certificate_issued') return '#7c3aed'
        if (type === 'event_created')      return 'var(--primary-color)'
        if (type === 'meeting_invite')     return 'var(--secondary-color)'
        return 'var(--success-color)'
    }

    return (
        <div className="notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="notif-bell-btn"
                onClick={() => setIsOpen(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
            >
                <i className="fa-regular fa-bell"></i>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-5px', right: '-8px', background: 'var(--danger-color)', color: 'white',
                        fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%', fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: '0', marginTop: '10px', width: '340px',
                    background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 1000, border: '1px solid var(--border-color)', animation: 'slideIn 0.2s ease-out'
                }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            Notifications {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({unreadCount})</span>}
                        </h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>Mark all read</button>
                            <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: '0.78rem', cursor: 'pointer' }}>Clear all</button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', gap: '11px', alignItems: 'flex-start',
                                    background: 'rgba(255,255,255,0.04)'
                                }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: colorFor(n.type), color: 'white', fontSize: '0.7rem'
                                    }}>
                                        <i className={`fa-solid ${iconFor(n.type)}`}></i>
                                    </div>

                                    {/* Body */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                            <strong style={{ color: 'var(--text-main)', fontSize: '0.83rem', lineHeight: '1.3' }}>{n.title}</strong>
                                            {/* ✕ delete button */}
                                            <button
                                                onClick={() => handleDelete(n.id)}
                                                title="Dismiss"
                                                style={{
                                                    flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                                    borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'var(--text-main)', fontSize: '0.7rem', lineHeight: 1, padding: 0
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', margin: '2px 0 5px' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>

                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                                            {n.message}
                                        </p>

                                        {/* Download button for certificate notifications */}
                                        {n.type === 'certificate_issued' && n.link && (
                                            <div style={{ marginTop: '8px' }}>
                                                <button
                                                    onClick={() => handleDownloadCert(n)}
                                                    disabled={downloadingId === n.id}
                                                    style={{
                                                        background: downloadingId === n.id ? '#5b21b6' : '#7c3aed',
                                                        border: 'none', color: 'white', fontSize: '0.72rem',
                                                        cursor: downloadingId === n.id ? 'default' : 'pointer',
                                                        padding: '4px 12px', borderRadius: '4px',
                                                        fontWeight: 'bold', letterSpacing: '0.04em',
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px'
                                                    }}
                                                >
                                                    {downloadingId === n.id
                                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Downloading…</>
                                                        : <><i className="fa-solid fa-download"></i> Download Certificate</>
                                                    }
                                                </button>
                                                {downloadError?.id === n.id && (
                                                    <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#f87171' }}>
                                                        ⚠ {downloadError.msg}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

    const [notifications, setNotifications] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Fetch notifications initially
    useEffect(() => {
        fetchNotifications()
        // Optional: Set up an interval or just rely on manual refresh. Polling every 60s for demo.
        const intervalId = setInterval(fetchNotifications, 60000)
        return () => clearInterval(intervalId)
    }, [])

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('tempus_token')
            if (!token) return

            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    const handleToggle = () => setIsOpen(!isOpen)

    const handleMarkAllRead = async () => {
        const token = localStorage.getItem('tempus_token')
        await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        fetchNotifications()
    }

    const handleClearAll = async () => {
        const token = localStorage.getItem('tempus_token')
        await fetch('/api/notifications', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        fetchNotifications()
    }

    const handleMarkRead = async (id, e) => {
        e.stopPropagation()
        const token = localStorage.getItem('tempus_token')
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        fetchNotifications()
    }

    const handleDownloadCert = async (link, filename, e) => {
        e.stopPropagation()
        const token = localStorage.getItem('tempus_token')
        try {
            const res = await fetch(link, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Download failed')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename || 'certificate.pdf'
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Certificate download error:', err)
        }
    }

    return (
        <div className="notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="notif-bell-btn"
                onClick={handleToggle}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
            >
                <i className="fa-regular fa-bell"></i>
                {unreadCount > 0 && (
                    <span
                        className="notif-badge"
                        style={{
                            position: 'absolute', top: '-5px', right: '-8px', background: 'var(--danger-color)', color: 'white',
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%', fontWeight: 'bold'
                        }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: '0', marginTop: '10px', width: '320px',
                    background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000,
                    border: '1px solid var(--border-color)', animation: 'slideIn 0.2s ease-out'
                }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Notifications</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>Mark all read</button>
                            <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer' }}>Clear</button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px',
                                    background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.05)',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px',
                                        background: n.type === 'certificate_issued' ? '#7c3aed'
                                            : n.type === 'event_created' ? 'var(--primary-color)'
                                            : n.type === 'meeting_invite' ? 'var(--secondary-color)'
                                            : 'var(--success-color)',
                                        color: 'white', fontSize: '0.75rem'
                                    }}>
                                        <i className={`fa-solid ${
                                            n.type === 'certificate_issued' ? 'fa-certificate'
                                            : n.type === 'event_created' ? 'fa-calendar-star'
                                            : n.type === 'meeting_invite' ? 'fa-handshake'
                                            : 'fa-circle-info'
                                        }`}></i>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px', gap: '6px' }}>
                                            <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.2' }}>{n.title}</strong>
                                            {/* Dismiss × button */}
                                            <button
                                                onClick={(e) => handleMarkRead(n.id, e)}
                                                title="Dismiss"
                                                style={{
                                                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                                                    fontSize: '1rem', lineHeight: 1, padding: '0 2px', flexShrink: 0,
                                                    opacity: 0.6
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</p>
                                        {n.type === 'certificate_issued' && n.link && (
                                            <button
                                                onClick={(e) => handleDownloadCert(n.link, null, e)}
                                                style={{
                                                    marginTop: '8px', background: '#7c3aed', border: 'none', color: 'white',
                                                    fontSize: '0.75rem', cursor: 'pointer', padding: '4px 12px',
                                                    borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.05em'
                                                }}
                                            >
                                                <i className="fa-solid fa-download" style={{ marginRight: '5px' }}></i>
                                                Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
