export default function StatCard({ icon, title, value, color = 'blue' }) {
    return (
        <div className="stat-card">
            <div className={`icon-box ${color}`}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <p className="value">{value}</p>
            </div>
        </div>
    )
}
