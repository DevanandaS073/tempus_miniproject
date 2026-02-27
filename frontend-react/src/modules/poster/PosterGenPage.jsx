import { useSearchParams } from 'react-router-dom'

export default function PosterGenPage() {
    const [searchParams] = useSearchParams()
    const queryString = searchParams.toString()

    return (
        <div className="w-full h-screen overflow-hidden">
            <iframe
                src={`/poster-gen/index.html${queryString ? '?' + queryString : ''}`}
                className="w-full h-full border-none"
                title="Poster Generator"
            />
        </div>
    )
}
