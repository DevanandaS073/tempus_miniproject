export default function PosterGrid({ posters = [] }) {
    if (posters.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-image" />
                <p>No posters yet</p>
                <small>Create posters from your events</small>
            </div>
        )
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {posters.map((p, i) => (
                <div key={i} className="card">
                    <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fa-solid fa-image" style={{ color: '#a855f7', fontSize: '20px' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Poster'}</h4>
                            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '13px' }}>{p.event || ''} {p.date || ''}</p>
                        </div>
                    </div>
                    <div className="card-body" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', paddingTop: '16px' }}>
                        <button className="btn-secondary" style={{ flex: 1 }}><i className="fa-solid fa-eye" /> View</button>
                        <button className="btn-secondary" style={{ flex: 1 }}><i className="fa-solid fa-download" /> Download</button>
                    </div>
                </div>
            ))}
        </div>
    )
}
