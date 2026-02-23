import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

/** SettingsPanel — Profile + Change Password */
export default function SettingsPanel() {
    const { user } = useAuth()
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

    const avatarUrl = user?.name
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3f3f46&color=fafafa&size=80`
        : ''

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {/* Profile Card */}
            <div className="card">
                <div className="card-header">
                    <h3><i className="fa-solid fa-user" style={{ color: '#a1a1aa', marginRight: '8px' }} /> Profile</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        {avatarUrl && <img src={avatarUrl} alt={user?.name} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />}
                        <div>
                            <p style={{ color: 'white', fontWeight: 500, margin: 0 }}>{user?.name}</p>
                            <p style={{ color: '#71717a', fontSize: '14px', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Name</label>
                            <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: 'white', outline: 'none', transition: 'border-color 0.2s' }} />
                        </div>
                        <div>
                            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Email</label>
                            <input value={profile.email} disabled
                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 16px', color: '#71717a', outline: 'none', cursor: 'not-allowed' }} />
                        </div>
                        <button onClick={() => alert('Profile updated!')} className="btn-primary" style={{ marginTop: '8px' }}>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="card">
                <div className="card-header">
                    <h3><i className="fa-solid fa-lock" style={{ color: '#a1a1aa', marginRight: '8px' }} /> Change Password</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Current Password</label>
                            <input type="password" value={passwords.current}
                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: 'white', outline: 'none', transition: 'border-color 0.2s' }} />
                        </div>
                        <div>
                            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>New Password</label>
                            <input type="password" value={passwords.new}
                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: 'white', outline: 'none', transition: 'border-color 0.2s' }} />
                        </div>
                        <div>
                            <label style={{ color: '#a1a1aa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Confirm Password</label>
                            <input type="password" value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: 'white', outline: 'none', transition: 'border-color 0.2s' }} />
                        </div>
                        <button onClick={() => alert('Password updated!')} className="btn-primary" style={{ marginTop: '8px' }}>
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
