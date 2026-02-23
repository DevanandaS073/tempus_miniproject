import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ navItems, activeSection, onSectionChange }) {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = (e) => {
        e.preventDefault()
        logout()
        navigate('/', { replace: true })
    }

    return (
        <nav className="sidebar">
            <div className="logo">
                <h2>Tempus</h2>
            </div>
            <ul className="nav-links">
                {navItems.map((item) => {
                    const isActive = activeSection === item.sectionKey
                    return (
                        <li key={item.sectionKey} className={isActive ? 'active' : ''}>
                            <a
                                href="#"
                                data-section={item.sectionKey}
                                onClick={(e) => {
                                    e.preventDefault()
                                    onSectionChange(item.sectionKey)
                                }}
                            >
                                <i className={`fa-solid ${item.icon}`}></i> {item.label}
                            </a>
                        </li>
                    )
                })}
                <li className="spacer"></li>
                <li>
                    <a href="#" className="logout" id="logout-btn" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                    </a>
                </li>
            </ul>
        </nav>
    )
}
