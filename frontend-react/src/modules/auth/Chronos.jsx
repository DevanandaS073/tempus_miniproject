import { useEffect, useRef, useState } from 'react'

export default function Chronos({ activeInput, passwordVisible, loginFailed, viewState }) {
    const [animState, setAnimState] = useState('') // '', 'waving', 'sad'
    const eyeLeftRef = useRef(null)
    const eyeRightRef = useRef(null)

    // Failed login → shake + sad
    useEffect(() => {
        if (loginFailed) {
            setAnimState('sad shake')
            setTimeout(() => {
                setAnimState(prev => prev.includes('sad') ? '' : prev)
            }, 2000)
        }
    }, [loginFailed])

    const handleClick = () => {
        if (animState.includes('waving')) return
        setAnimState('waving')
        setTimeout(() => {
            setAnimState(prev => prev.includes('waving') ? '' : prev)
        }, 1000)
    }

    // Eye tracking logic
    useEffect(() => {
        if (animState.includes('waving') || passwordVisible) {
            if (eyeLeftRef.current) eyeLeftRef.current.style.transform = `translate(0px, 0px)`
            if (eyeRightRef.current) eyeRightRef.current.style.transform = `translate(0px, 0px)`
            return
        }

        if (activeInput) {
            const focusedEl = document.getElementById(activeInput === 'password' ? 'login-password' : activeInput)
            if (focusedEl) {
                const rect = focusedEl.getBoundingClientRect()
                const targetY = rect.top + rect.height / 2
                const valLength = focusedEl.value?.length || 0
                const progress = Math.min(1, valLength / 25)
                const targetX = rect.left + (rect.width * progress * 0.9) + 10
                updateEyes(targetX, targetY)
                return
            }
        }

        const handleMouseMove = (e) => updateEyes(e.clientX, e.clientY)
        document.addEventListener('mousemove', handleMouseMove)
        return () => document.removeEventListener('mousemove', handleMouseMove)
    }, [animState, passwordVisible, activeInput])

    function updateEyes(targetX, targetY) {
        ;[eyeLeftRef, eyeRightRef].forEach(ref => {
            if (!ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const eyeCX = rect.left + rect.width / 2
            const eyeCY = rect.top + rect.height / 2
            const dx = targetX - eyeCX
            const dy = targetY - eyeCY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const clampedDist = Math.min(dist, 3.5)
            const angle = Math.atan2(dy, dx)
            const x = Math.cos(angle) * clampedDist
            const y = Math.sin(angle) * clampedDist
            ref.current.style.transform = `translate(${x}px, ${y}px)`
        })
    }

    let containerClass = ''
    let mascotClass = ''

    // Mimic the original script.js state switch logic
    if (viewState === 'role' || viewState === 'login') {
        containerClass = 'look-up'
    } else if (viewState === 'signup') {
        containerClass = 'look-up'
        mascotClass = 'party'
    } else if (viewState === 'forgot') {
        containerClass = 'look-up'
        mascotClass = 'confused'
    }

    if (passwordVisible) {
        mascotClass += ' close-eyes cover-eyes'
    }

    return (
        <div className={`mascot-container ${containerClass}`}>
            <div className={`mascot ${animState} ${mascotClass}`} onClick={handleClick}>
                <div className="mascot-head">
                    <div className="mascot-eyes">
                        <div ref={eyeLeftRef} className="eye left"></div>
                        <div ref={eyeRightRef} className="eye right"></div>
                    </div>
                    <div className="mascot-antenna">
                        <div className="antenna-bulb"></div>
                    </div>
                </div>
                <div className="mascot-hand left"></div>
                <div className="mascot-hand right"></div>
                <div className="mascot-body"></div>
            </div>
        </div>
    )
}
