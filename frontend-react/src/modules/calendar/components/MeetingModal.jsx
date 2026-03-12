import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'

/**
 * MeetingModal — Create or Edit a meeting
 */
export default function MeetingModal({ isOpen, onClose, onCreated, meeting }) {
    const { token } = useAuth()
    const isEditMode = !!meeting

    const [form, setForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        duration: 1,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [collisionWarning, setCollisionWarning] = useState(null) // { type, title, start, end }

    // Pre-fill in edit mode
    useEffect(() => {
        if (meeting) {
            const start = new Date(meeting.start_time)
            const end = new Date(meeting.end_time)
            const durationHrs = (end - start) / (1000 * 60 * 60)
            setForm({
                title: meeting.title || '',
                date: start.toISOString().split('T')[0],
                time: start.toTimeString().slice(0, 5),
                duration: durationHrs || 1,
            })
        } else {
            setForm({
                title: '',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                duration: 1,
            })
        }
        setError('')
        setCollisionWarning(null)
    }, [meeting, isOpen])

    if (!isOpen) return null

    const submit = async (force = false) => {
        setError('')
        setCollisionWarning(null)
        setLoading(true)

        try {
            const startTime = new Date(`${form.date}T${form.time}`)
            const endTime = new Date(startTime.getTime() + form.duration * 60 * 60 * 1000)

            const url = isEditMode
                ? `/api/calendar/meetings/${meeting.meeting_id}`
                : `/api/calendar/meetings${force ? '?force=true' : ''}`
            const method = isEditMode ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                }),
            })

            const data = await res.json()

            if (res.status === 409 && data.conflictWith) {
                setCollisionWarning(data.conflictWith)
                return
            }

            if (!res.ok) {
                setError(data.error || `Failed to ${isEditMode ? 'update' : 'create'} meeting`)
                return
            }

            onCreated?.()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        submit(false)
    }

    const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass-card p-6 w-full max-w-md relative z-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">
                        <i className="fas fa-video text-blue-400 mr-2" />{isEditMode ? 'Edit Meeting' : 'New Meeting'}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <i className="fas fa-times" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-none px-4 py-2 mb-4">
                        {error}
                    </div>
                )}

                {collisionWarning && (
                    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-sm rounded-none px-4 py-3 mb-4">
                        <div className="flex items-start gap-2 mb-2">
                            <i className="fas fa-exclamation-triangle text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-200">Schedule Conflict</p>
                                <p className="text-xs mt-0.5 text-amber-400">
                                    Overlaps with {collisionWarning.type} &quot;{collisionWarning.title}&quot;
                                    &nbsp;({fmtTime(collisionWarning.start)} – {fmtTime(collisionWarning.end)})
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => submit(true)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                            >
                                Create Anyway
                            </button>
                            <button
                                onClick={() => setCollisionWarning(null)}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-400 text-xs uppercase tracking-wider hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Title</label>
                        <input
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                            placeholder="Meeting title"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Time</label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Duration (hours)</label>
                        <input
                            type="number"
                            value={form.duration}
                            onChange={e => setForm({ ...form, duration: parseFloat(e.target.value) })}
                            step="0.5"
                            min="0.5"
                            max="8"
                            className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-none font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : isEditMode ? 'Update Meeting' : 'Create Meeting'}
                    </button>
                </form>
            </div>
        </div>
    )
}
