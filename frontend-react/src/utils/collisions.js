/**
 * Detects overlapping time boundaries between meetings and events.
 * 
 * @param {Array} meetings - Array of meeting objects (needs date/start_time)
 * @param {Array} events - Array of event objects (needs date/start_size, endDate/end_date)
 * @returns {Array} Array of collision alert objects
 */
export function detectCollisions(meetings, events) {
    const collisions = []
    let collisionId = 1

    if (!Array.isArray(meetings) || !Array.isArray(events)) {
        return collisions
    }

    // Standardize Meeting blocks
    const mBlocks = meetings.map(m => {
        const start = new Date(m.start_time || m.date).getTime()
        // Assuming 1.5 hours default duration if end_time isn't provided
        const end = m.end_time ? new Date(m.end_time).getTime() : start + (1.5 * 3600000)
        return { title: m.title, start, end, type: 'meeting' }
    })

    // Standardize Event blocks
    const eBlocks = events.map(e => {
        const start = new Date(e.start_date || e.date).getTime()
        const end = new Date(e.end_date || e.endDate).getTime()
        return { title: e.title, start, end, type: 'event' }
    })

    // Check for M vs E overlaps
    for (const m of mBlocks) {
        if (isNaN(m.start)) continue

        for (const e of eBlocks) {
            if (isNaN(e.start) || isNaN(e.end)) continue

            // Overlap condition: Start A < End B AND End A > Start B
            if (m.start < e.end && m.end > e.start) {
                const overlapTime = new Date(Math.max(m.start, e.start)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                collisions.push({
                    id: collisionId++,
                    meeting1: m.title,
                    meeting2: e.title,
                    time: `Conflict around ${overlapTime}`
                })
            }
        }
    }

    // Check for M vs M overlaps
    for (let i = 0; i < mBlocks.length; i++) {
        for (let j = i + 1; j < mBlocks.length; j++) {
            const m1 = mBlocks[i]
            const m2 = mBlocks[j]
            if (m1.start < m2.end && m1.end > m2.start) {
                const overlapTime = new Date(Math.max(m1.start, m2.start)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                collisions.push({
                    id: collisionId++,
                    meeting1: m1.title,
                    meeting2: m2.title,
                    time: `Conflict around ${overlapTime}`
                })
            }
        }
    }

    // Check for E vs E overlaps (joined events that clash with each other)
    for (let i = 0; i < eBlocks.length; i++) {
        for (let j = i + 1; j < eBlocks.length; j++) {
            const e1 = eBlocks[i]
            const e2 = eBlocks[j]
            if (isNaN(e1.start) || isNaN(e1.end) || isNaN(e2.start) || isNaN(e2.end)) continue
            if (e1.start < e2.end && e1.end > e2.start) {
                const overlapTime = new Date(Math.max(e1.start, e2.start)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                collisions.push({
                    id: collisionId++,
                    meeting1: e1.title,
                    meeting2: e2.title,
                    time: `Conflict around ${overlapTime}`
                })
            }
        }
    }

    return collisions
}
