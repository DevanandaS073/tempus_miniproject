import { useState } from 'react'

export default function Calendar({ meetings = [], events = [], onDayClick, large = false }) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const hasMeeting = (day) =>
        meetings.some(m => {
            const d = new Date(m.start_time || m.date)
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
        })

    const hasEvent = (day) =>
        events.some(e => {
            const d = new Date(e.start_date || e.date)
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
        })

    const today = new Date()
    const isToday = (day) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

    return (
        <div className={`calendar-wrapper ${large ? 'large' : ''}`} style={large ? { height: '100%' } : {}}>
            <div className="calendar-header">
                <button onClick={prevMonth} className="btn-icon"><i className="fa-solid fa-chevron-left" /></button>
                <h4>{monthLabel}</h4>
                <button onClick={nextMonth} className="btn-icon"><i className="fa-solid fa-chevron-right" /></button>
            </div>

            <div className="calendar-days-header">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className="calendar-grid">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const hasMtg = hasMeeting(day)

                    // Find if there's an event on this day, and if we've joined any of them
                    const dayEvents = events.filter(e => {
                        const d = new Date(e.start_date || e.date)
                        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
                    })
                    const hasEvt = dayEvents.length > 0
                    const isJoinedEvt = dayEvents.some(e => e.isJoined)

                    const today_ = isToday(day)

                    return (
                        <div
                            key={day}
                            onClick={() => onDayClick?.(year, month, day)}
                            className={`calendar-day ${hasMtg ? 'has-meeting' : ''} ${hasEvt ? 'has-event' : ''} ${today_ ? 'today' : ''}`}
                        >
                            <div className="day-number">{day}</div>
                            {(hasMtg || hasEvt) && (
                                <div className="day-dots">
                                    {hasMtg && <div className="dot meeting-dot" />}
                                    {hasEvt && <div className={`dot ${isJoinedEvt ? 'joined-event-dot' : 'event-dot'}`} />}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
