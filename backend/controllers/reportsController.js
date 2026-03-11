const prisma = require('../prismaClient');

// ─── Helper: Calculate MoM percentage ────────────────────────────────────────
function momPct(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// ─── Helper: Calculate time invested in minutes ──────────────────────────────
function calcMinutes(items, startKey, endKey) {
    return items.reduce((sum, item) => {
        const start = new Date(item[startKey]);
        const end = new Date(item[endKey]);
        return sum + Math.max(0, (end - start) / 60000);
    }, 0);
}

// ─── GET /api/reports/latest ─────────────────────────────────────────────────
exports.getLatestReport = async (req, res) => {
    try {
        const report = await prisma.user_reports.findFirst({
            where: { user_id: req.user.id },
            orderBy: { generated_at: 'desc' }
        });

        if (!report) {
            return res.status(200).json({ exists: false, message: 'No reports generated yet.' });
        }

        res.json({ exists: true, report });
    } catch (err) {
        console.error('Get Latest Report Error:', err);
        res.status(500).json({ error: 'Failed to fetch latest report' });
    }
};

// ─── POST /api/reports/generate ──────────────────────────────────────────────
exports.generateReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.company_id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // ── Parallel queries for current period (last 30 days) ──────────────
        const [
            eventsCreatedCurr,
            eventsJoinedCurr,
            meetingsScheduledCurr,
            meetingsAttendedCurr,
            joinedEventDetailsCurr,
            attendedMeetingDetailsCurr,
            totalCompanyEvents
        ] = await Promise.all([
            // Events I created in last 30 days
            prisma.events.count({
                where: { created_by: userId, company_id: companyId, created_at: { gte: thirtyDaysAgo } }
            }),
            // Events I joined in last 30 days
            prisma.event_participants.count({
                where: { user_id: userId, event: { company_id: companyId, start_date: { gte: thirtyDaysAgo } } }
            }),
            // Meetings I scheduled in last 30 days
            prisma.meetings.count({
                where: { created_by: userId, company_id: companyId, created_at: { gte: thirtyDaysAgo } }
            }),
            // Meetings I attended in last 30 days
            prisma.meeting_participants.count({
                where: { user_id: userId, meeting: { company_id: companyId, start_time: { gte: thirtyDaysAgo } } }
            }),
            // Full event data for time calculation (events I joined)
            prisma.events.findMany({
                where: {
                    company_id: companyId,
                    start_date: { gte: thirtyDaysAgo },
                    participants: { some: { user_id: userId } }
                },
                select: { start_date: true, end_date: true, event_type: true }
            }),
            // Full meeting data for time calculation (meetings I attended)
            prisma.meetings.findMany({
                where: {
                    company_id: companyId,
                    start_time: { gte: thirtyDaysAgo },
                    participants: { some: { user_id: userId } }
                },
                select: { start_time: true, end_time: true }
            }),
            // Total company events in last 30 days (for engagement rate)
            prisma.events.count({
                where: { company_id: companyId, start_date: { gte: thirtyDaysAgo } }
            })
        ]);

        // ── Parallel queries for previous period (30-60 days ago) ────────────
        const [
            eventsCreatedPrev,
            eventsJoinedPrev,
            meetingsScheduledPrev,
            meetingsAttendedPrev,
            joinedEventDetailsPrev,
            attendedMeetingDetailsPrev
        ] = await Promise.all([
            prisma.events.count({
                where: { created_by: userId, company_id: companyId, created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
            }),
            prisma.event_participants.count({
                where: { user_id: userId, event: { company_id: companyId, start_date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }
            }),
            prisma.meetings.count({
                where: { created_by: userId, company_id: companyId, created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
            }),
            prisma.meeting_participants.count({
                where: { user_id: userId, meeting: { company_id: companyId, start_time: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }
            }),
            prisma.events.findMany({
                where: {
                    company_id: companyId,
                    start_date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                    participants: { some: { user_id: userId } }
                },
                select: { start_date: true, end_date: true }
            }),
            prisma.meetings.findMany({
                where: {
                    company_id: companyId,
                    start_time: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                    participants: { some: { user_id: userId } }
                },
                select: { start_time: true, end_time: true }
            })
        ]);

        // ── Calculate derived metrics ────────────────────────────────────────

        // Time Invested (current)
        const eventMinutesCurr = Math.round(calcMinutes(joinedEventDetailsCurr, 'start_date', 'end_date'));
        const meetingMinutesCurr = Math.round(calcMinutes(attendedMeetingDetailsCurr, 'start_time', 'end_time'));
        const timeInvestedCurr = eventMinutesCurr + meetingMinutesCurr;

        // Time Invested (previous)
        const eventMinutesPrev = Math.round(calcMinutes(joinedEventDetailsPrev, 'start_date', 'end_date'));
        const meetingMinutesPrev = Math.round(calcMinutes(attendedMeetingDetailsPrev, 'start_time', 'end_time'));
        const timeInvestedPrev = eventMinutesPrev + meetingMinutesPrev;

        // Engagement Rate (events joined / total company events)
        const engagementRate = totalCompanyEvents > 0
            ? Math.round((eventsJoinedCurr / totalCompanyEvents) * 100)
            : 0;

        // Top Event Types
        const typeCounts = {};
        joinedEventDetailsCurr.forEach(e => {
            typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        });
        const topEventTypes = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));

        // MoM percentages
        const momEventsPct = momPct(eventsJoinedCurr, eventsJoinedPrev);
        const momMeetingsPct = momPct(meetingsAttendedCurr, meetingsAttendedPrev);
        const momTimePct = momPct(timeInvestedCurr, timeInvestedPrev);

        // ── Save snapshot ────────────────────────────────────────────────────
        const report = await prisma.user_reports.create({
            data: {
                user_id: userId,
                events_created: eventsCreatedCurr,
                events_joined: eventsJoinedCurr,
                meetings_scheduled: meetingsScheduledCurr,
                meetings_attended: meetingsAttendedCurr,
                time_invested_minutes: timeInvestedCurr,
                engagement_rate_pct: engagementRate,
                top_event_types: topEventTypes,
                prev_events_created: eventsCreatedPrev,
                prev_events_joined: eventsJoinedPrev,
                prev_meetings_scheduled: meetingsScheduledPrev,
                prev_meetings_attended: meetingsAttendedPrev,
                prev_time_invested_minutes: timeInvestedPrev,
                mom_events_pct: momEventsPct,
                mom_meetings_pct: momMeetingsPct,
                mom_time_pct: momTimePct
            }
        });

        res.json({ exists: true, report });
    } catch (err) {
        console.error('Generate Report Error:', err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};
