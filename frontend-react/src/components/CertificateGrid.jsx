export default function CertificateGrid({ certificates = [] }) {
    if (certificates.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-certificate" />
                <p>No certificates yet</p>
                <small>Certificates will appear here after events</small>
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {certificates.map((cert, i) => (
                <div key={i} className="card">
                    <div className="card-body" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fa-solid fa-certificate" style={{ color: '#4ade80', fontSize: '20px' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h4 style={{ color: 'white', margin: 0, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cert.name || 'Certificate'}</h4>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, backgroundColor: cert.status === 'generated' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: cert.status === 'generated' ? '#4ade80' : '#eab308' }}>
                                    {cert.status === 'generated' ? '✓ Generated' : '⏳ Pending'}
                                </span>
                            </div>
                            <p style={{ color: '#a1a1aa', margin: 0, fontSize: '13px' }}>{cert.event || ''} {cert.date || ''}</p>
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
