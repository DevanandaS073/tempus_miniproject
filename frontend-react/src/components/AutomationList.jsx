/** AutomationList — Shows automation job statuses */
export default function AutomationList({ jobs = [] }) {
    if (jobs.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-robot" />
                <p>No automation jobs</p>
            </div>
        )
    }

    const statusIcon = {
        processing: { icon: 'fa-spinner fa-spin', color: '#60a5fa' },
        completed: { icon: 'fa-check', color: '#4ade80' },
        failed: { icon: 'fa-exclamation', color: '#f87171' },
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map((j, i) => {
                const s = statusIcon[j.status] || statusIcon.processing
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: '12px' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: 0 }}>{j.name || 'Job'}</p>
                            <p style={{ color: '#71717a', fontSize: '12px', margin: 0, textTransform: 'capitalize' }}>{j.status}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
