export default function CollisionList({ collisions = [] }) {
    if (collisions.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-solid fa-check-circle" style={{ color: '#4ade80' }} />
                <p>No scheduling conflicts</p>
            </div>
        )
    }

    return (
        <>
            {collisions.map((c, i) => (
                <div key={i} className="collision-item">
                    <div className="collision-icon">
                        <i className="fa-solid fa-triangle-exclamation" />
                    </div>
                    <div className="collision-info">
                        <h4>{c.meeting1} &amp; {c.meeting2}</h4>
                        <p>{c.time}</p>
                    </div>
                </div>
            ))}
        </>
    )
}
