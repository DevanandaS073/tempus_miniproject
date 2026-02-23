import { useSearchParams, useNavigate } from 'react-router-dom'
import BlobBackground from '../../components/BlobBackground'

export default function PosterGenPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()

    const title = params.get('title') || 'Untitled Event'

    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center relative">
            <BlobBackground />

            <div className="glass-card p-8 max-w-lg w-full mx-4 relative z-10 text-center">
                <button onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 text-zinc-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left mr-2" />Back
                </button>

                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-image text-purple-400 text-2xl" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Poster Generator</h1>
                <p className="text-zinc-400 text-sm mb-6">Generate a poster for your event</p>

                <div className="glass-card p-4 text-left mb-6">
                    <p className="text-zinc-400 text-xs mb-1">Event</p>
                    <p className="text-white font-medium">{title}</p>
                </div>

                <div className="bg-zinc-800/50 border border-dashed border-zinc-600 rounded-xl p-12 mb-6">
                    <i className="fas fa-wand-magic-sparkles text-zinc-600 text-3xl mb-3 block" />
                    <p className="text-zinc-500 text-sm">Canvas module coming soon</p>
                    <p className="text-zinc-600 text-xs">Poster templates + overlay engine will be integrated here</p>
                </div>

                <button
                    onClick={() => alert('Poster generation will be available once the canvas module is integrated.')}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                    Generate Poster
                </button>
            </div>
        </div>
    )
}
