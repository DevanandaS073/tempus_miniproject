import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PosterGenPage() {
    const [searchParams] = useSearchParams()
    const { token } = useAuth()
    const navigate = useNavigate()
    const iframeRef = useRef(null)
    const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

    const eventId = searchParams.get('eventId')
    const mode = searchParams.get('mode') || 'view'

    // Build iframe URL — only pass display-relevant params (not eventId/mode)
    const iframeParams = new URLSearchParams()
    ;['title', 'date', 'location', 'description'].forEach(k => {
        const v = searchParams.get(k)
        if (v) iframeParams.set(k, v)
    })
    iframeParams.set('mode', mode)

    // When iframe loads, try to fetch existing saved poster data and push it in
    const handleIframeLoad = useCallback(async () => {
        if (!eventId || !iframeRef.current) return
        try {
            const res = await fetch(`/api/events/${eventId}/media/poster/data`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const { poster_data } = await res.json()
                const parsed = JSON.parse(poster_data)
                iframeRef.current.contentWindow?.postMessage(
                    { type: 'load_poster_data', data: parsed },
                    window.location.origin
                )
            }
        } catch {
            // No saved poster yet — iframe will use URL params for pre-fill
        }
    }, [eventId, token])

    // Listen for save requests from iframe
    useEffect(() => {
        const handleMessage = async (e) => {
            if (e.origin !== window.location.origin) return
            if (e.data?.type === 'go_back') {
                navigate(-1)
                return
            }
            if (e.data?.type !== 'save_poster' || !eventId) return

            setSaveStatus('saving')
            try {
                const res = await fetch(`/api/events/${eventId}/media/poster`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ poster_data: JSON.stringify(e.data.formData) })
                })
                if (res.ok) {
                    setSaveStatus('saved')
                    setTimeout(() => navigate('/operations'), 1200)
                } else {
                    setSaveStatus('error')
                }
            } catch {
                setSaveStatus('error')
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [eventId, token, navigate])

    const iframeSrc = `/poster-gen/index.html${iframeParams.toString() ? '?' + iframeParams.toString() : ''}`

    return (
        <div className="w-full h-screen overflow-hidden relative">
            {/* Save overlay */}
            {saveStatus === 'saving' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-zinc-900 border border-zinc-700 px-6 py-4 text-white font-mono text-sm tracking-wider">
                        Saving poster…
                    </div>
                </div>
            )}
            {saveStatus === 'saved' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-zinc-900 border border-emerald-500/50 px-6 py-4 text-emerald-400 font-mono text-sm tracking-wider">
                        ✓ Poster saved — returning to operations…
                    </div>
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="absolute top-4 right-4 bg-red-900/80 border border-red-500/50 px-4 py-3 text-red-300 font-mono text-xs z-20">
                    Save failed. Please try again.
                    <button onClick={() => setSaveStatus(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
                </div>
            )}

            <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full h-full border-none"
                title="Poster Generator"
                onLoad={handleIframeLoad}
            />
        </div>
    )
}
