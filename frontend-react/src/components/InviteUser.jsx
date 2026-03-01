import { useState, useEffect } from 'react'

export default function InviteUser() {
    const [email, setEmail] = useState('')
    const [roleId, setRoleId] = useState('')
    const [roles, setRoles] = useState([])
    const [status, setStatus] = useState({ type: '', msg: '' })
    const [isLoadingRoles, setIsLoadingRoles] = useState(true)

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('tempus_token')
                const res = await fetch('/api/companies/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok) {
                    setRoles(data)
                    // Auto-select the 'Worker' role if it exists (assuming it's a safe default)
                    const workerRole = data.find(r => r.name.toLowerCase() === 'worker')
                    if (workerRole) setRoleId(workerRole.id)
                    else if (data.length > 0) setRoleId(data[0].id)
                }
            } catch (err) {
                console.error("Failed to fetch roles", err)
            } finally {
                setIsLoadingRoles(false)
            }
        }
        fetchRoles()
    }, [])

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email || !roleId) {
            setStatus({ type: 'error', msg: 'Email and Role are required.' })
            return
        }

        setStatus({ type: 'loading', msg: 'Sending invite...' })

        try {
            const token = localStorage.getItem('tempus_token')
            const res = await fetch('/api/invites/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, role_id: roleId })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send invite')

            setStatus({ type: 'success', msg: `Invitation sent to ${email}!` })
            setEmail('')

            setTimeout(() => setStatus({ type: '', msg: '' }), 4000)
        } catch (error) {
            setStatus({ type: 'error', msg: error.message })
        }
    }

    return (
        <div className="card settings-card">
            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0 }}>Invite Team Member</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send an invitation to a Free Agent to join your Workspace.</p>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
                <form onSubmit={handleInvite} className="profile-fields" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Associate Email</label>
                        <input
                            type="email"
                            placeholder="e.g. nolan@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', background: 'var(--bg-main)', color: 'white' }}
                        />
                    </div>

                    <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assign Role</label>
                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            disabled={isLoadingRoles || roles.length === 0}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', background: 'var(--bg-main)', color: 'white' }}
                        >
                            {isLoadingRoles ? (
                                <option>Loading roles...</option>
                            ) : roles.length > 0 ? (
                                roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))
                            ) : (
                                <option>No roles found</option>
                            )}
                        </select>
                    </div>

                    {status.msg && (
                        <div style={{ padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: status.type === 'error' ? '#dc2626' : status.type === 'success' ? '#16a34a' : 'var(--text-secondary)', background: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : 'var(--bg-blue-light)' }}>
                            {status.msg}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ marginTop: '10px', alignSelf: 'flex-start' }} disabled={status.type === 'loading' || isLoadingRoles}>
                        {status.type === 'loading' ? 'Sending...' : 'Send Invitation'}
                    </button>
                </form>
            </div>
        </div>
    )
}
