export default function ReportList({ reports = [] }) {
    if (reports.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-file-pdf" />
                <p>No reports available</p>
            </div>
        )
    }
    return (
        <div className="reports-list">
            {reports.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '16px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '15px' }}>{r.name || 'Report'}</h4>
                        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '13px' }}>{r.size || ''} {r.date || ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><i className="fa-solid fa-eye" /> View</button>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><i className="fa-solid fa-download" /> Download</button>
                    </div>
                </div>
            ))}
        </div>
    )
}
