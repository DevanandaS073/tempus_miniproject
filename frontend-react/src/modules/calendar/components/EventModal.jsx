import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

const EVENT_TYPES = ['conference', 'workshop', 'seminar', 'social', 'training', 'other']

/**
 * EventModal —  Create event with collision detection + success step
 */
export default function EventModal({ isOpen, onClose, onCreated }) {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState('form') // form | success
    const [createdEvent, setCreatedEvent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const now = new Date()
    const [form, setForm] = useState({
        title: '',
        description: '',
        event_type: 'conference',
        start_date: now.toISOString().slice(0, 16),
        end_date: new Date(now.getTime() + 2 * 3600000).toISOString().slice(0, 16),
        location: '',
    })

    if (!isOpen) return null

    const handleStartChange = (val) => {
        const oldStart = new Date(form.start_date)
        const oldEnd = new Date(form.end_date)
        const gap = oldEnd.getTime() - oldStart.getTime()

        const newStart = new Date(val)
        // Keep the duration gap exact
        const newEnd = new Date(newStart.getTime() + gap)

        setForm({
            ...form,
            start_date: val,
            end_date: newEnd.toISOString().slice(0, 16)
        })
    }

    const submitEvent = async (force = false) => {
        setError('')
        setLoading(true)
        try {
            const url = force ? '/api/events?force=true' : '/api/events'
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            })

            if (res.status === 409) {
                const data = await res.json()
                const confirmed = window.confirm(
                    `⚠️ Scheduling Conflict\n\n${data.message || 'This event conflicts with an existing event.'}\n\nDo you want to create this event anyway?`
                )
                if (confirmed) {
                    await submitEvent(true)
                }
                return
            }

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create event')
            }

            const data = await res.json()
            setCreatedEvent(data.event || { title: form.title })
            setStep('success')
            onCreated?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        submitEvent()
    }

    const handleClose = () => {
        setStep('form')
        setCreatedEvent(null)
        setForm({
            title: '', description: '', event_type: 'conference',
            start_date: now.toISOString().slice(0, 16),
            end_date: new Date(now.getTime() + 2 * 3600000).toISOString().slice(0, 16),
            location: '',
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass-card p-6 w-full max-w-lg relative z-10" onClick={e => e.stopPropagation()}>
                {step === 'form' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">
                                <i className="fas fa-calendar-plus text-orange-400 mr-2" />New Event
                            </h3>
                            <button onClick={handleClose} className="text-zinc-400 hover:text-white">
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-none px-4 py-2 mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                                    placeholder="Event title" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors resize-none"
                                    placeholder="Event description" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">Type</label>
                                    <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors">
                                        {EVENT_TYPES.map(t => <option key={t} value={t} className="bg-zinc-800">{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">Location</label>
                                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors"
                                        placeholder="Location" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">Start</label>
                                    <input type="datetime-local" value={form.start_date}
                                        onChange={e => handleStartChange(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">End</label>
                                    <input type="datetime-local" value={form.end_date}
                                        onChange={e => setForm({ ...form, end_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-none font-medium transition-colors disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create Event'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-none flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-check text-green-400 text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Event Created!</h3>
                        <p className="text-zinc-400 text-sm mb-6">{createdEvent?.title}</p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        title: createdEvent?.title || '',
                                        date: createdEvent?.start_date || form.start_date || '',
                                        location: createdEvent?.location || form.location || '',
                                        description: createdEvent?.description || form.description || ''
                                    })
                                    navigate(`/poster-gen?${params.toString()}`)
                                }}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-none text-sm font-medium transition-colors"
                            >
                                <i className="fas fa-image mr-2" />Create Poster
                            </button>
                            <button
                                onClick={() => alert('Certificate generation coming soon!')}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-none text-sm font-medium transition-colors"
                            >
                                <i className="fas fa-certificate mr-2" />Generate Certificate
                            </button>
                        </div>

                        <button onClick={handleClose} className="text-zinc-400 hover:text-white text-sm mt-4 transition-colors">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
