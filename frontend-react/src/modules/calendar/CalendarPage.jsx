import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import Calendar from '../../components/Calendar'
import DayDetail from '../../components/DayDetail'
import MeetingModal from '../../components/MeetingModal'
import EventModal from '../../components/EventModal'
import BlobBackground from '../../components/BlobBackground'

export default function CalendarPage() {
    const { user, token } = useAuth()
    const [selectedDate, setSelectedDate] = useState(null)
    const [showMeetingModal, setShowMeetingModal] = useState(false)
    const [showEventModal, setShowEventModal] = useState(false)

    const [data, setData] = useState({ meetings: [], events: [] })

    const fetchData = useCallback(async () => {
        try {
            const [meetingsRes, eventsRes] = await Promise.all([
                fetch('/api/calendar/meetings', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/events'),
            ])
            const meetings = await meetingsRes.json()
            const events = await eventsRes.json()
            setData({
                meetings: Array.isArray(meetings) ? meetings : [],
                events: Array.isArray(events) ? events : [],
            })
        } catch (err) {
            console.error('Failed to fetch calendar data:', err)
        }
    }, [token])

    useEffect(() => { fetchData() }, [fetchData])

    // Build role-appropriate nav
    const calNav = user?.role === 'admin'
        ? [
            { icon: 'fa-th-large', label: 'Overview', sectionKey: 'overview' },
            { icon: 'fa-calendar', label: 'Calendar', sectionKey: 'calendar' },
        ]
        : [
            { icon: 'fa-th-large', label: 'Overview', sectionKey: 'overview' },
            { icon: 'fa-calendar', label: 'Calendar', sectionKey: 'calendar' },
        ]

    // Merge meetings + events for upcoming panel, sorted by date
    const allItems = [
        ...data.meetings.map(m => ({
            type: 'meeting', title: m.title, date: new Date(m.start_time),
            time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detail: `${m.participants?.length || 0} participants`,
        })),
        ...data.events.map(e => ({
            type: 'event', title: e.title, date: new Date(e.start_date),
            time: new Date(e.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detail: e.event_type || e.type || '',
        })),
    ].sort((a, b) => a.date - b.date).filter(i => i.date >= new Date()).slice(0, 10)

    return (
        <div className="min-h-screen bg-zinc-900 relative">
            <BlobBackground />
            <Sidebar navItems={calNav} activeSection="calendar" onSectionChange={(s) => {
                if (s === 'overview') {
                    window.location.href = user?.role === 'admin' ? '/dashboard' : '/worker-dashboard'
                }
            }} />

            <main className="ml-60 p-6">
                <TopBar title="My Calendar" user={user} />

                {/* Action buttons */}
                <div className="flex gap-3 mb-6">
                    <button onClick={() => setShowMeetingModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i className="fas fa-video mr-2" />New Meeting
                    </button>
                    <button onClick={() => setShowEventModal(true)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <i className="fas fa-calendar-plus mr-2" />New Event
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar (2 cols) */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <Calendar meetings={data.meetings} events={data.events}
                            onDayClick={(y, m, d) => setSelectedDate({ year: y, month: m, day: d })} />
                    </div>

                    {/* Side panel: Upcoming */}
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-semibold text-white mb-4">Upcoming</h3>
                        {allItems.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-4">Nothing upcoming</p>
                        )}
                        <div className="space-y-2">
                            {allItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg">
                                    <div className={`${item.type === 'meeting' ? 'bg-blue-500/20' : 'bg-orange-500/20'} rounded-lg px-2 py-1.5 text-center min-w-[50px]`}>
                                        <span className={`${item.type === 'meeting' ? 'text-blue-400' : 'text-orange-400'} text-[10px] font-medium block`}>
                                            {item.time}
                                        </span>
                                        <span className="text-zinc-500 text-[9px] block">
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                        <p className="text-zinc-500 text-[10px] capitalize">{item.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <MeetingModal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} onCreated={fetchData} />
            <EventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} onCreated={fetchData} />
            {selectedDate && (
                <DayDetail selectedDate={selectedDate} events={data.events} meetings={data.meetings}
                    onClose={() => setSelectedDate(null)} />
            )}
        </div>
    )
}
