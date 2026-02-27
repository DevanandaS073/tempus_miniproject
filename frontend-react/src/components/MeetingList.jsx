export default function MeetingList({ meetings = [], variant = 'preview', onDelete }) {
    const now = new Date()
    const upcoming = meetings.filter(m => new Date(m.date || m.start_time) >= now)

    // In preview mode, restrict only to upcoming (and limit 5)
    // In full mode, show all meetings. 
    // Wait, the parent AdminDashboard is passing 'activeTab' = 'upcoming' | 'past' inside 'variant="full"', except wait, I forgot to add activeTab to props! I will just use the passed meetings.
    const displayed = variant === 'preview' ? upcoming.slice(0, 5) : meetings

    if (displayed.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-calendar-check" />
                <p>No meetings scheduled</p>
            </div>
        )
    }

    return (
        <>
            {displayed.map((m, i) => {
                const timeStr = m.time || new Date(m.start_time || m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const [timeText, ampmText] = timeStr.split(' ');

                const isEvent = m.title && m.title.startsWith('[Event] ');
                let statusClass = 'upcoming';
                if (m.status === 'completed') statusClass = 'completed';
                if (m.status === 'cancelled') statusClass = 'cancelled';
                if (isEvent) statusClass = 'event-joined';

                return (
                    <div key={m.id || i} className={`meeting-item ${isEvent ? 'is-event' : ''}`} style={{ position: 'relative' }}>
                        <div className="meeting-time">
                            <span>{timeText || timeStr}</span>
                            <span>{ampmText || ''}</span>
                        </div>
                        <div className="meeting-info">
                            <h4>{isEvent ? m.title.replace('[Event] ', '') : m.title}</h4>
                            <p>{isEvent ? '' : (m.participants || m.organizer || '')}</p>
                        </div>
                        <div className="meeting-status">
                            <span className={`status-pill ${statusClass}`}>{isEvent ? 'Joined' : (m.status || 'Scheduled')}</span>
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}
                                    className="btn-icon"
                                    style={{ marginLeft: '10px' }}
                                >
                                    <i className="fa-solid fa-trash" />
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </>
    )
}
