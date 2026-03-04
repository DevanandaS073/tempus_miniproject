import { useState } from 'react'

export default function JoinEventModal({ event, user, onClose, onSuccess }) {
    const [note, setNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    if (!event) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            const token = localStorage.getItem('tempus_token')
            // Using the backend route defined in server/eventsController
            const response = await fetch('/api/events/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    event_id: event.event_id || event.id,
                    note: note // Note might not be saved depending on backend, but sent anyway
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join event')
            }

            onSuccess(data.message || 'Successfully registered!')
        } catch (err) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="glass-card p-6 w-full max-w-lg relative z-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white"><i className="fa-solid fa-calendar-check mr-2 text-primary-color"></i> Register for Event</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                <div>
                    <div className="bg-white/5 p-4 rounded-none mb-6 border border-white/10">
                        <h4 className="text-white font-medium mb-1">{event.title}</h4>
                        <p className="text-sm text-zinc-400 m-0">
                            <i className="fa-regular fa-clock mr-2 text-primary-color"></i>
                            {new Date(event.start_date || event.date).toLocaleString()}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-none px-4 py-3 mb-6 flex items-center">
                            <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Full Name</label>
                            <input type="text" value={user?.name || 'Worker'} readOnly disabled
                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Role</label>
                            <input type="text" value={user?.role || 'Worker'} readOnly disabled
                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Message / Note <span className="font-normal opacity-70">(optional)</span></label>
                            <textarea
                                placeholder="Any questions or notes for the organizer..."
                                rows="3"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-400 transition-colors resize-none"
                            ></textarea>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" className="px-5 py-2.5 rounded-none font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-none font-medium transition-colors disabled:opacity-50 flex items-center justify-center">
                                {isSubmitting ? 'Registering...' : <><i className="fa-solid fa-paper-plane mr-2"></i> Confirm Registration</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
