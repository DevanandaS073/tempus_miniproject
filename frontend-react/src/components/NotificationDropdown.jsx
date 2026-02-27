import { useState, useEffect, useRef } from 'react'

export default function NotificationDropdown() {
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
        e.stopPropagation() // Prevent link click if there is one
        const token = localStorage.getItem('tempus_token')
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        fetchNotifications()
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
                                    padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px',
                                    background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        background: n.type === 'event_created' ? 'var(--primary-color)' : n.type === 'meeting_invite' ? 'var(--secondary-color)' : 'var(--success-color)',
                                        color: 'white'
                                    }}>
                                        <i className={`fa-solid ${n.type === 'event_created' ? 'fa-calendar-star' : n.type === 'meeting_invite' ? 'fa-handshake' : 'fa-circle-info'}`}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{n.title}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</p>
                                        {!n.is_read && (
                                            <button onClick={(e) => handleMarkRead(n.id, e)} style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                                                Mark as read
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
