import { useState, useEffect, useCallback, Fragment } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import StatCard from '../../components/StatCard'
import Calendar from '../../components/Calendar'
import DayDetail from '../../components/DayDetail'
import MeetingList from '../../components/MeetingList'
import EventModal from '../../components/EventModal'
import CollisionList from '../../components/CollisionList'
import CertificateGrid from '../../components/CertificateGrid'
import PosterGrid from '../../components/PosterGrid'
import ReportList from '../../components/ReportList'
import SettingsPanel from '../../components/SettingsPanel'
import BlobBackground from '../../components/BlobBackground'
import { detectCollisions } from '../../utils/collisions'
import '../dashboard/dashboard.css'

const WORKER_NAV = [
    { icon: 'fa-gauge', label: 'Dashboard', sectionKey: 'overview' },
    { icon: 'fa-calendar', label: 'Calendar', sectionKey: 'calendar' },
    { icon: 'fa-handshake', label: 'Meetings', sectionKey: 'meetings' },
    { icon: 'fa-triangle-exclamation', label: 'Alerts', sectionKey: 'collisions' },
    { icon: 'fa-certificate', label: 'Certificates', sectionKey: 'certificates' },
    { icon: 'fa-image', label: 'Posters', sectionKey: 'posters' },
    { icon: 'fa-file-lines', label: 'Reports', sectionKey: 'reports' },
    { icon: 'fa-gear', label: 'Settings', sectionKey: 'settings' },
]

const SECTION_TITLES = {
    overview: 'Dashboard',
    calendar: 'My Calendar',
    meetings: 'All Meetings',
    collisions: 'Collision Alerts',
    certificates: 'Certificates',
    posters: 'Event Posters',
    reports: 'Reports',
    settings: 'Profile & Settings',
}

export default function WorkerDashboard() {
    const { user, token } = useAuth()
    const [activeSection, setActiveSection] = useState('overview')
    const [selectedDate, setSelectedDate] = useState(null)
    const [meetingTab, setMeetingTab] = useState('upcoming')
    const [showEventModal, setShowEventModal] = useState(false)

    const [data, setData] = useState({
        meetings: [], events: [], collisions: [],
        certificates: [], posters: [], reports: [],
        stats: { meetings: 0, events: 0, hours: 0, collisions: 0 },
    })

    const fetchData = useCallback(async () => {
        try {
            const [meetingsRes, eventsRes] = await Promise.all([
                fetch('/api/calendar/meetings', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/events'),
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
                status: 'upcoming'
            }))

            const detectedCollisions = detectCollisions(mappedMeetings, mappedEvents)

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

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="dashboard-grid section-content" id="section-overview">
                        <div className="grid-section stats-row">
                            <StatCard icon="fa-video" title="Personal Meetings" value={data.stats.meetings} color="blue" />
                            <StatCard icon="fa-calendar-check" title="Upcoming Events" value={data.stats.events} color="green" />
                            <StatCard icon="fa-clock" title="Meeting Hours" value={data.stats.hours} color="purple" />
                            <StatCard icon="fa-triangle-exclamation" title="Collision Alerts" value={data.stats.collisions} color="orange" />
                        </div>
                        <div className="grid-section main-panels">
                            <div className="panel-column left">
                                <div className="card calendar-card">
                                    <div className="card-header">
                                        <h3>Calendar Overview</h3>
                                    </div>
                                    <div className="card-body">
                                        <Calendar meetings={data.meetings} events={data.events} onDayClick={handleDayClick} />
                                    </div>
                                </div>
                                <div className="card upcoming-card">
                                    <div className="card-header">
                                        <h3>Upcoming Meetings</h3>
                                        <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); setActiveSection('meetings') }}>View All</a>
                                    </div>
                                    <div className="card-body">
                                        <div className="meetings-list">
                                            <MeetingList meetings={data.meetings} variant="preview" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="panel-column right">
                                <div className="card collision-card">
                                    <div className="card-header">
                                        <h3>Collision Alerts</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="collision-list">
                                            <CollisionList collisions={data.collisions} />
                                        </div>
                                    </div>
                                </div>
                                <div className="card automation-card">
                                    <div className="card-header">
                                        <h3>Recent Certificates</h3>
                                    </div>
                                    <div className="card-body">
                                        <CertPreview />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 'calendar':
                return (
                    <div className="dashboard-grid section-content" id="section-calendar">
                        <div className="card" style={{ minHeight: '500px', marginBottom: selectedDate ? '16px' : '0' }}>
                            <div className="card-header">
                                <h3>My Calendar</h3>
                            </div>
                            <div className="card-body">
                                <Calendar meetings={data.meetings} events={data.events} onDayClick={handleDayClick} large={true} />
                            </div>
                        </div>
                        {selectedDate && (
                            <div className="card">
                                <div className="card-body">
                                    <DayDetail selectedDate={selectedDate} events={data.events} meetings={data.meetings} onClose={() => setSelectedDate(null)} />
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'meetings':
                return (
                    <div className="dashboard-grid section-content" id="section-meetings">
                        <div className="section-header-bar">
                            <h2>All Meetings</h2>
                            <div className="tab-bar">
                                <button className={`tab ${meetingTab === 'upcoming' ? 'active' : ''}`} onClick={() => setMeetingTab('upcoming')}>Upcoming</button>
                                <button className={`tab ${meetingTab === 'past' ? 'active' : ''}`} onClick={() => setMeetingTab('past')}>Past</button>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-body">
                                <div className="meetings-list full-list">
                                    <MeetingList meetings={data.meetings} variant="full" activeTab={meetingTab} />
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 'collisions':
                return (
                    <div className="dashboard-grid section-content" id="section-collisions">
                        <div className="section-header-bar"><h2>Collision Alerts</h2></div>
                        <div className="card">
                            <div className="card-body"><div className="collision-list"><CollisionList collisions={data.collisions} /></div></div>
                        </div>
                    </div>
                )

            case 'certificates':
                return (
                    <div className="dashboard-grid section-content" id="section-certificates">
                        <div className="section-header-bar"><h2>Certificates</h2></div>
                        <div className="card-grid">
                            <CertificateGrid certificates={data.certificates} />
                        </div>
                    </div>
                )

            case 'posters':
                return (
                    <div className="dashboard-grid section-content" id="section-posters">
                        <div className="section-header-bar"><h2>Event Posters</h2></div>
                        <div className="card-grid">
                            <PosterGrid posters={data.posters} />
                        </div>
                    </div>
                )

            case 'reports':
                return (
                    <div className="dashboard-grid section-content" id="section-reports">
                        <div className="section-header-bar"><h2>Reports</h2></div>
                        <div className="card">
                            <div className="card-body"><div className="reports-list"><ReportList reports={data.reports} /></div></div>
                        </div>
                    </div>
                )

            case 'settings':
                return (
                    <div className="dashboard-grid section-content" id="section-settings">
                        <div className="section-header-bar"><h2>Profile & Settings</h2></div>
                        <SettingsPanel user={user} />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <Fragment>
            <BlobBackground />
            <div className="dashboard-container">
                <Sidebar navItems={WORKER_NAV} activeSection={activeSection} onSectionChange={setActiveSection} />
                <main className="main-content">
                    <TopBar title={SECTION_TITLES[activeSection]} user={user} alertCount={data.collisions.length} />
                    {renderSection()}
                </main>
            </div>
            {showEventModal && <EventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} onCreated={fetchData} />}
        </Fragment>
    )
}
