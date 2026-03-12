import { useState, useEffect, useCallback, Fragment } from 'react'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/StatCard'
import Calendar from '../calendar/components/Calendar'
import MeetingList from '../dashboard/components/MeetingList'
import CollisionList from '../calendar/components/CollisionList'
import { detectCollisions } from '../../utils/collisions'
import '../dashboard/dashboard.css'

export default function WorkerDashboard() {
    const { token } = useAuth()
    const [selectedDate, setSelectedDate] = useState(null)

    const [data, setData] = useState({
        meetings: [], events: [], collisions: [],
        certificates: [], posters: [], reports: [],
        stats: { meetings: 0, events: 0, hours: 0, collisions: 0 },
    })

    const fetchData = useCallback(async () => {
        try {
            const [meetingsRes, eventsRes] = await Promise.all([
                fetch('/api/calendar/meetings', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
            ])
            const meetings = await meetingsRes.json()
            const events = await eventsRes.json()

            const meetingsArr = Array.isArray(meetings) ? meetings : []
            const eventsArr = Array.isArray(events) ? events : []

            const mappedMeetings = meetingsArr.map(m => ({
                id: m.meeting_id,
                title: m.title,
                time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                participants: m.participants?.length > 0 ? `${m.participants.length} Participants` : 'No Participants',
                organizer: `Organized by ${m.organizer || 'Admin'}`,
                status: m.status,
                date: new Date(m.start_time)
            }))

            const mappedEvents = eventsArr.map(e => ({
                id: e.event_id,
                title: e.title,
                type: e.event_type,
                description: e.description || '',
                location: e.location || '',
                date: new Date(e.start_date),
                endDate: new Date(e.end_date),
                isJoined: e.isJoined,
                status: 'upcoming'
            }))

            // Only check collisions for events the user has actually joined
            const joinedEvents = mappedEvents.filter(e => e.isJoined)
            const detectedCollisions = detectCollisions(mappedMeetings, joinedEvents)

            setData(prev => ({
                ...prev,
                meetings: mappedMeetings,
                events: mappedEvents,
                collisions: detectedCollisions,
                stats: {
                    meetings: mappedMeetings.length,
                    events: mappedEvents.length,
                    hours: (mappedMeetings.length * 1.5).toFixed(1),
                    collisions: detectedCollisions.length,
                },
            }))
        } catch (err) {
            console.error('Failed to fetch data:', err)
        }
    }, [token])

    useEffect(() => { fetchData() }, [fetchData])

    const handleDayClick = (year, month, day) => setSelectedDate({ year, month, day })

    const CertPreview = () => {
        const certs = data.certificates.slice(0, 3)
        if (certs.length === 0) {
            return (
                <div className="empty-state">
                    <i className="fa-solid fa-certificate" />
                    <p>No certificates yet</p>
                </div>
            )
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {certs.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <i className="fa-solid fa-certificate" style={{ color: '#4ade80', fontSize: '14px' }} />
                        <span style={{ color: 'white', fontSize: '14px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: c.status === 'generated' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: c.status === 'generated' ? '#4ade80' : '#eab308' }}>
                            {c.status === 'generated' ? '✓' : '⏳'}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Fragment>
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-4xl font-light text-slate-100 uppercase tracking-widest">Dashboard Overview</h1>
                    <p className="text-zinc-500 font-mono text-sm uppercase">Worker Telemetry & Daily Directives</p>
                </header>

                <div className="dashboard-grid section-content" id="section-overview">
                    <div className="grid-section stats-row">
                        <StatCard icon="fa-video" title="Personal Meetings" value={data.stats.meetings} color="blue" />
                        <StatCard icon="fa-calendar-check" title="Upcoming Events" value={data.stats.events} color="green" />
                        <StatCard icon="fa-clock" title="Meeting Hours" value={data.stats.hours} color="purple" />
                        <StatCard icon="fa-triangle-exclamation" title="Collision Alerts" value={data.stats.collisions} color="orange" />
                    </div>

                    <div className="grid-section main-panels mt-4">
                        <div className="panel-column left">
                            <div className="card calendar-card bg-zinc-900 border border-zinc-800 p-8">
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Calendar Overview</h2>
                                <Calendar meetings={data.meetings} events={data.events} onDayClick={handleDayClick} />
                            </div>

                            <div className="card upcoming-card bg-zinc-900 border border-zinc-800 p-8 mt-8">
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Upcoming Meetings</h2>
                                <MeetingList meetings={data.meetings} variant="preview" />
                            </div>
                        </div>

                        <div className="panel-column right flex flex-col gap-8">
                            <div className="card collision-card bg-zinc-900 border border-zinc-800 p-8">
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Collision Alerts</h2>
                                <CollisionList collisions={data.collisions} />
                            </div>

                            <div className="card automation-card bg-zinc-900 border border-zinc-800 p-8">
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Recent Certificates</h2>
                                <CertPreview />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}
