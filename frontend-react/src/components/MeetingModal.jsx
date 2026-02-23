import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * MeetingModal — Create new meeting
 */
export default function MeetingModal({ isOpen, onClose, onCreated }) {
    const { token } = useAuth()
    const [form, setForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        duration: 1,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const startTime = new Date(`${form.date}T${form.time}`)
            const endTime = new Date(startTime.getTime() + form.duration * 60 * 60 * 1000)

            const res = await fetch('/api/calendar/meetings', {
                method: 'POST',
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

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create meeting')
            }

            setForm({ title: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), duration: 1 })
            onCreated?.()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass-card p-6 w-full max-w-md relative z-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">
                        <i className="fas fa-video text-blue-400 mr-2" />New Meeting
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <i className="fas fa-times" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Title</label>
                        <input
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
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
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Time</label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
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
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Meeting'}
                    </button>
                </form>
            </div>
        </div>
    )
}
