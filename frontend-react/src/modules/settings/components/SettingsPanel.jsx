import { useState } from 'react'

export default function SettingsPanel({ user }) {
    const [name, setName] = useState(user?.name || '')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [profileStatus, setProfileStatus] = useState({ type: '', msg: '' })
    const [passwordStatus, setPasswordStatus] = useState({ type: '', msg: '' })

    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileStatus({ type: 'loading', msg: 'Saving...' })

        try {
            const token = localStorage.getItem('tempus_token')
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update profile')

            setProfileStatus({ type: 'success', msg: 'Profile updated successfully!' })

            // Optional: Update local storage / context if you want it to reflect immediately without refresh
            if (data.user) {
                const storedUser = JSON.parse(localStorage.getItem('tempus_user'))
                localStorage.setItem('tempus_user', JSON.stringify({ ...storedUser, name: data.user.name }))
                // A full app reload might be easiest to resync context since we aren't passing setAuth mapped down here
            }

            setTimeout(() => setProfileStatus({ type: '', msg: '' }), 3000)
        } catch (error) {
            setProfileStatus({ type: 'error', msg: error.message })
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', msg: 'New passwords do not match' })
            return
        }

        setPasswordStatus({ type: 'loading', msg: 'Updating...' })

        try {
            const token = localStorage.getItem('tempus_token')
            const res = await fetch('/api/auth/password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update password')

            setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            setTimeout(() => setPasswordStatus({ type: '', msg: '' }), 3000)
        } catch (error) {
            setPasswordStatus({ type: 'error', msg: error.message })
        }
    }

    const email = user?.email || 'email@example.com'
    const roleText = user?.role === 'admin' ? 'Administrator' : 'Worker'

    return (
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '20px' }}>
            <div className="card settings-card">
                <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>My Profile</h3>
                </div>
                <div className="card-body" style={{ padding: '24px' }}>
                    <form onSubmit={handleProfileSubmit} className="profile-view" style={{ display: 'flex', gap: '30px' }}>
                        <div className="profile-avatar-large" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '4px solid white', boxShadow: 'var(--shadow-md)' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff&size=120`}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="profile-fields" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
                                />
                            </div>
                            <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', background: 'var(--bg-main)', color: 'var(--text-muted)' }}
                                />
                            </div>
                            <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</label>
                                <input
                                    type="text"
                                    value={roleText}
                                    disabled
                                    style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', background: 'var(--bg-main)', color: 'var(--text-muted)' }}
                                />
                            </div>

                            {profileStatus.msg && (
                                <div style={{ padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: profileStatus.type === 'error' ? '#dc2626' : profileStatus.type === 'success' ? '#16a34a' : 'var(--text-secondary)', background: profileStatus.type === 'error' ? '#fee2e2' : profileStatus.type === 'success' ? '#dcfce7' : 'var(--bg-blue-light)' }}>
                                    {profileStatus.msg}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px', alignSelf: 'flex-start' }} disabled={profileStatus.type === 'loading'}>
                                {profileStatus.type === 'loading' ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card settings-card">
                <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>Change Password</h3>
                </div>
                <div className="card-body" style={{ padding: '24px' }}>
                    <form onSubmit={handlePasswordSubmit} className="profile-fields" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Password</label>
                            <input
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password (min 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength="6"
                                style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength="6"
                                style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
                            />
                        </div>

                        {passwordStatus.msg && (
                            <div style={{ padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: passwordStatus.type === 'error' ? '#dc2626' : passwordStatus.type === 'success' ? '#16a34a' : 'var(--text-secondary)', background: passwordStatus.type === 'error' ? '#fee2e2' : passwordStatus.type === 'success' ? '#dcfce7' : 'var(--bg-blue-light)' }}>
                                {passwordStatus.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ marginTop: '10px', alignSelf: 'flex-start' }} disabled={passwordStatus.type === 'loading'}>
                            {passwordStatus.type === 'loading' ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
