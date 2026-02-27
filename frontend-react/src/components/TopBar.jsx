import NotificationDropdown from './NotificationDropdown';

export default function TopBar({ title, user, alertCount = 0 }) {
    const avatarUrl = user?.name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`
        : ''

    return (
        <header className="top-bar">
            <div className="welcome-text">
                <h1>{title}</h1>
                <p>Welcome back, <span id="user-name">{user?.name?.split(' ')[0] || 'User'}</span>!</p>
            </div>

            <div className="user-profile">
                <img src={avatarUrl} alt="Avatar" id="user-avatar" />
                <div className="profile-info">
                    <span className="name" id="profile-name">{user?.name?.toUpperCase() || 'USER'}</span>
                    <span className="role">{user?.role === 'admin' ? 'Administrator' : 'Worker'}</span>
                </div>
            </div>

            <div className="header-actions">
                <div className="search-bar">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search..." />
                </div>

                <NotificationDropdown />

            </div>
        </header>
    )
}
