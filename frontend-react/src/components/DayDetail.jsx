export default function DayDetail({ selectedDate, events = [], meetings = [], onClose }) {
    if (!selectedDate) return null

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
                                return (
                                    <div key={i} className="meeting-item">
                                        <div className="meeting-time">
                                            <span>{timeText}</span><span>{ampmText}</span>
                                        </div>
                                        <div className="meeting-info">
                                            <h4>{m.title}</h4>
                                            <p>{m.participants || ''}</p>
                                        </div>
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
                                        <p>{e.type} {e.location && `· ${e.location}`}</p>
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
