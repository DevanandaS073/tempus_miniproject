import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EventCard from './components/EventCard';
import EventBuilder from './components/EventBuilder';

export default function OperationsPage() {
    const { token, hasFeature } = useAuth();
    const [activeTab, setActiveTab] = useState('company');
    const [companyEvents, setCompanyEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // ─── Fetch both datasets on mount ───────────────────────────────────────
    useEffect(() => {
        if (token) loadEvents();
    }, [token]);

    const loadEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const [companyRes, myRes] = await Promise.all([
                fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/events/mine', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (!companyRes.ok) throw new Error('Failed to load company events');
            if (!myRes.ok) throw new Error('Failed to load your events');

            const companyData = await companyRes.json();
            const myData = await myRes.json();

            setCompanyEvents(companyData);
            setMyEvents(myData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { key: 'company', label: 'Company Operations', count: companyEvents.length },
        { key: 'mine', label: 'My Operations', count: myEvents.length }
    ];

    const currentEvents = activeTab === 'company' ? companyEvents : myEvents;

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col h-full w-full pt-20">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white m-0">Operations Hub</h1>
                    <p className="text-zinc-400 mt-2 m-0 text-sm">Manage and track all workspace events and operations.</p>
                </div>
                {hasFeature('event:create') && (
                    <button
                        onClick={() => { setEditingEvent(null); setShowBuilder(true); }}
                        className="px-5 py-2.5 bg-white text-black text-xs font-bold tracking-wider uppercase
                                   hover:bg-zinc-200 transition-colors shrink-0"
                    >
                        + Create Operation
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-300 hover:text-white ml-4">×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-0 border-b border-zinc-800 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2
                            ${activeTab === tab.key
                                ? 'text-white border-white'
                                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-600'}`}
                    >
                        {tab.label}
                        <span className={`ml-2 px-2 py-0.5 text-[10px] font-mono
                            ${activeTab === tab.key ? 'bg-white/10 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Event Grid */}
            {loading ? (
                <div className="text-zinc-500 font-mono text-sm tracking-widest uppercase animate-pulse py-20 text-center">
                    Loading Operations...
                </div>
            ) : currentEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentEvents.map(event => (
                        <EventCard
                            key={event.event_id}
                            event={event}
                            onRefresh={loadEvents}
                            onEdit={(evt) => { setEditingEvent(evt); setShowBuilder(true); }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-zinc-500 text-sm">
                        {activeTab === 'company'
                            ? 'No operations scheduled for your workspace yet.'
                            : 'You have not joined any operations yet.'}
                    </p>
                </div>
            )}

            {/* Event Builder Modal */}
            {showBuilder && (
                <EventBuilder
                    event={editingEvent}
                    onClose={() => { setShowBuilder(false); setEditingEvent(null); }}
                    onSaved={loadEvents}
                />
            )}
        </div>
    );
}
