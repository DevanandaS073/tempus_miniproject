import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

// ─── MoM Trend Arrow ────────────────────────────────────────────────────────
function MomBadge({ value }) {
    if (value === 0) return <span className="text-zinc-500 text-[10px] font-mono">— 0%</span>;
    const isUp = value > 0;
    return (
        <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(value)}%
        </span>
    );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, color = 'blue', mom }) {
    const colorMap = {
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
        purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
        amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
        emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
        rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400',
        cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`bg-gradient-to-br ${c} border p-5 flex flex-col gap-1`}>
            <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">{title}</div>
            <div className="flex items-end gap-3">
                <span className={`text-3xl font-black ${c.split(' ').pop()}`}>{value}</span>
                {mom !== undefined && <MomBadge value={mom} />}
            </div>
            {subtitle && <div className="text-[11px] text-zinc-600 font-mono">{subtitle}</div>}
        </div>
    );
}

// ─── Event Type Bar ──────────────────────────────────────────────────────────
function EventTypeBar({ type, count, maxCount }) {
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-mono w-28 truncate uppercase">{type}</span>
            <div className="flex-1 bg-zinc-800 h-2">
                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-zinc-500 font-mono w-6 text-right">{count}</span>
        </div>
    );
}

// ─── Main Reports Page ───────────────────────────────────────────────────────
export default function ReportsPage() {
    const { token } = useAuth();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const reportRef = useRef(null);

    // Fetch latest report on mount
    useEffect(() => {
        fetchLatest();
    }, []);

    const fetchLatest = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports/latest', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.exists) setReport(data.report);
            else setReport(null);
        } catch (err) {
            console.error('Failed to fetch report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.exists) setReport(data.report);
        } catch (err) {
            console.error('Failed to generate report:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportRef.current) return;

        // Use the browser's native print engine — it fully supports oklch() colors.
        // We inject a temporary print stylesheet to hide everything except the report.
        const printCSS = document.createElement('style');
        printCSS.textContent = `
            @media print {
                /* Aggressively hide everything */
                body * { visibility: hidden !important; }
                
                /* Show the report area and its parents specifically */
                #report-print-area, #report-print-area * { visibility: visible !important; }
                
                /* Reset ALL positioning for the report area to center it perfectly */
                #report-print-area {
                    position: fixed !important;
                    top: 0.5in !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    width: 100% !important;
                    max-width: 800px !important;
                    background: #09090b !important;
                    padding: 0.5in !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                @page { margin: 0; size: A4; }
            }
        `;
        document.head.appendChild(printCSS);
        window.print();
        document.head.removeChild(printCSS);
    };

    // ── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="text-zinc-600 font-mono text-sm tracking-widest uppercase animate-pulse">
                    Loading Report...
                </div>
            </div>
        );
    }

    // ── No Report State ──────────────────────────────────────────────────────
    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-6">
                <div className="text-zinc-600 font-mono text-sm tracking-widest uppercase">
                    No reports generated yet
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-6 py-3 bg-white text-black font-bold text-xs tracking-widest uppercase
                               hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                    {generating ? 'Generating...' : 'Generate First Report'}
                </button>
            </div>
        );
    }

    // ── Report Dashboard ─────────────────────────────────────────────────────
    const topTypes = Array.isArray(report.top_event_types) ? report.top_event_types : [];
    const maxTypeCount = topTypes.length > 0 ? Math.max(...topTypes.map(t => t.count)) : 0;
    const hours = Math.floor(report.time_invested_minutes / 60);
    const mins = report.time_invested_minutes % 60;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-white font-black text-2xl tracking-tight">Activity Report</h1>
                    <p className="text-zinc-500 text-xs font-mono mt-1">
                        Generated {new Date(report.generated_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-white text-black font-bold text-[10px] tracking-widest uppercase
                                   hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {generating ? '...' : 'Generate New'}
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 font-bold text-[10px] tracking-widest uppercase
                                   hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Report Content (PDF capture target) */}
            <div ref={reportRef} id="report-print-area" className="flex flex-col gap-6 bg-zinc-950 p-4">
                {/* Section: Overview */}
                <div className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] uppercase border-b border-zinc-800 pb-2">
                    30-Day Overview
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <KPICard
                        title="Events Created"
                        value={report.events_created}
                        subtitle={`prev: ${report.prev_events_created}`}
                        color="blue"
                    />
                    <KPICard
                        title="Events Joined"
                        value={report.events_joined}
                        subtitle={`prev: ${report.prev_events_joined}`}
                        color="purple"
                        mom={report.mom_events_pct}
                    />
                    <KPICard
                        title="Meetings Scheduled"
                        value={report.meetings_scheduled}
                        subtitle={`prev: ${report.prev_meetings_scheduled}`}
                        color="cyan"
                    />
                    <KPICard
                        title="Meetings Attended"
                        value={report.meetings_attended}
                        subtitle={`prev: ${report.prev_meetings_attended}`}
                        color="amber"
                        mom={report.mom_meetings_pct}
                    />
                    <KPICard
                        title="Time Invested"
                        value={`${hours}h ${mins}m`}
                        subtitle={`prev: ${Math.floor(report.prev_time_invested_minutes / 60)}h ${report.prev_time_invested_minutes % 60}m`}
                        color="emerald"
                        mom={report.mom_time_pct}
                    />
                    <KPICard
                        title="Engagement Rate"
                        value={`${report.engagement_rate_pct}%`}
                        subtitle="Events attended / company total"
                        color="rose"
                    />
                </div>

                {/* Section: Top Event Types */}
                {topTypes.length > 0 && (
                    <>
                        <div className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] uppercase border-b border-zinc-800 pb-2 mt-4">
                            Top Event Types
                        </div>
                        <div className="flex flex-col gap-3 bg-zinc-900/50 border border-zinc-800 p-5">
                            {topTypes.map((t, i) => (
                                <EventTypeBar key={i} type={t.type} count={t.count} maxCount={maxTypeCount} />
                            ))}
                        </div>
                    </>
                )}

                {/* Section: MoM Summary */}
                <div className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] uppercase border-b border-zinc-800 pb-2 mt-4">
                    Month-over-Month Performance
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-5 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Events</span>
                        <MomBadge value={report.mom_events_pct} />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-5 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Meetings</span>
                        <MomBadge value={report.mom_meetings_pct} />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-5 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Time</span>
                        <MomBadge value={report.mom_time_pct} />
                    </div>
                </div>
            </div>
        </div>
    );
}
