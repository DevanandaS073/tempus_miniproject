import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'

export default function DayDetail({ selectedDate, events = [], meetings = [], onClose, onEditMeeting, onDeleteMeeting }) {
    if (!selectedDate) return null

    const { hasFeature, user } = useAuth()
    const canEditOwn = hasFeature('meeting:edit_own')
    const canEditAny = hasFeature('meeting:edit_any')
    const canDeleteOwn = hasFeature('meeting:delete_own')
    const canDeleteAny = hasFeature('meeting:delete_any')

    const { year, month, day } = selectedDate
    const dateStr = new Date(year, month, day).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })

    const dayMeetings = meetings.filter(m => {
        const d = new Date(m.start_time || m.date)
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

    const dayEvents = events.filter(e => {
        const d = new Date(e.start_date || e.date)
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

    const [deletingMeetingId, setDeletingMeetingId] = useState(null)

    return (
        <div className="day-detail open">
            <div className="day-detail-header">
                <h3>{dateStr}</h3>
                <button onClick={onClose} className="btn-icon">
                    <i className="fa-solid fa-times" />
                </button>
            </div>
            <div className="day-detail-content">
                {dayMeetings.length === 0 && dayEvents.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa' }}>
                        <p>No items scheduled for this day</p>
                    </div>
                )}

                {dayMeetings.length > 0 && (
                    <div className="detail-section" style={{ marginBottom: '24px' }}>
                        <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-video" style={{ color: '#60a5fa' }} /> Meetings
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dayMeetings.map((m, i) => {
                                const timeStr = m.time || new Date(m.start_time || m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const [timeText, ampmText] = timeStr.split(' ');
                                const isEvent = m.title && m.title.startsWith('[Event] ');

                                return (
                                    <div key={i} className={`meeting-item ${isEvent ? 'is-event' : ''}`}>
                                        <div className="meeting-time">
                                            <span>{timeText}</span><span>{ampmText}</span>
                                        </div>
                                        <div className="meeting-info" style={{ flex: 1 }}>
                                            <h4>{isEvent ? m.title.replace('[Event] ', '') : m.title}</h4>
                                            <p>{isEvent ? 'Joined Event' : `${m.participants?.length || 0} participants`}</p>
                                        </div>
                                        {/* Edit / Delete buttons — ownership-aware */}
                                        {(() => {
                                            const isCreator = m.created_by === user?.id;
                                            const showEdit = canEditAny || (canEditOwn && isCreator);
                                            const showDelete = canDeleteAny || (canDeleteOwn && isCreator);
                                            if (isEvent || (!showEdit && !showDelete)) return null;
                                            return (
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}>
                                                    {showEdit && onEditMeeting && (
                                                        <button
                                                            onClick={() => onEditMeeting(m)}
                                                            style={{
                                                                padding: '4px 8px', fontSize: '10px', fontWeight: 'bold',
                                                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                                color: '#a1a1aa', cursor: 'pointer', textTransform: 'uppercase',
                                                                letterSpacing: '0.05em'
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {showDelete && onDeleteMeeting && (
                                                        deletingMeetingId === m.meeting_id ? (
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                <button
                                                                    onClick={() => { onDeleteMeeting(m.meeting_id); setDeletingMeetingId(null); }}
                                                                    style={{
                                                                        padding: '4px 8px', fontSize: '10px', fontWeight: 'bold',
                                                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                                                        color: '#f87171', cursor: 'pointer', textTransform: 'uppercase'
                                                                    }}
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingMeetingId(null)}
                                                                    style={{
                                                                        padding: '4px 6px', fontSize: '10px',
                                                                        background: 'transparent', border: 'none',
                                                                        color: '#71717a', cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeletingMeetingId(m.meeting_id)}
                                                                style={{
                                                                    padding: '4px 8px', fontSize: '10px', fontWeight: 'bold',
                                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: '#a1a1aa', cursor: 'pointer', textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em'
                                                                }}
                                                            >
                                                                Del
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {dayEvents.length > 0 && (
                    <div className="detail-section">
                        <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-calendar-star" style={{ color: '#fb923c' }} /> Events
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dayEvents.map((e, i) => (
                                <div key={i} className="meeting-item">
                                    <div className="meeting-time">
                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ALL</span>
                                        <span style={{ fontSize: '10px' }}>DAY</span>
                                    </div>
                                    <div className="meeting-info">
                                        <h4>{e.title}</h4>
                                        <p>{e.event_type || e.type} {e.location && `· ${e.location}`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
