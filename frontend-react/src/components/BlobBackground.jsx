import { useEffect, useRef } from 'react'

export default function BlobBackground() {
    const blob1 = useRef(null)
    const blob2 = useRef(null)
    const blob3 = useRef(null)

    useEffect(() => {
        function randomizeBlobs() {
            ;[blob1, blob2, blob3].forEach((ref) => {
                if (!ref.current) return
                const rx = Math.random() * 20 - 10
                const ry = Math.random() * 20 - 10
                const rs = 0.8 + Math.random() * 0.4
                ref.current.style.transform = `translate(${rx}%, ${ry}%) scale(${rs})`
            })
        }
        randomizeBlobs()
        const interval = setInterval(randomizeBlobs, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="fixed inset-0 overflow-hidden -z-10" style={{ filter: 'blur(80px)', background: '#18181b' }}>
            <div
                ref={blob1}
                className="absolute rounded-full opacity-80 transition-all duration-[4s] ease-in-out"
                style={{
                    top: '-10%', left: '-10%', width: '50vw', height: '50vw',
                    background: '#52525b',
                }}
            />
            <div
                ref={blob2}
                className="absolute rounded-full opacity-80 transition-all duration-[4s] ease-in-out"
                style={{
                    bottom: '-10%', right: '-10%', width: '60vw', height: '60vw',
                    background: '#71717a',
                }}
            />
            <div
                ref={blob3}
                className="absolute rounded-full opacity-60 transition-all duration-[4s] ease-in-out"
                style={{
                    bottom: '20%', left: '20%', width: '40vw', height: '40vw',
                    background: '#3f3f46',
                }}
            />
        </div>
    )
}
