import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-light text-slate-100 uppercase tracking-widest">Workspace Overview</h1>
                <p className="text-zinc-500 font-mono text-sm uppercase">Global Aggregation Metrics Hub</p>
            </header>

            {/* Brutalist Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Events', val: '0', color: 'border-blue-500' },
                    { label: 'Pending Posters', val: '0', color: 'border-purple-500' },
                    { label: 'Active Users', val: '1', color: 'border-teal-500' },
                    { label: 'System Health', val: '100%', color: 'border-emerald-500' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-zinc-900 border-l-[3px] ${stat.color} p-6 flex flex-col justify-between`}>
                        <h3 className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-4">{stat.label}</h3>
                        <div className="text-4xl font-light text-white">{stat.val}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Main Feed Feed */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 min-h-[400px] flex flex-col">
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Upcoming Schedule</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-zinc-600 font-mono text-sm uppercase">No upcoming appointments scheduled</p>
                    </div>
                </div>

                {/* Right Rail Modules */}
                <div className="flex flex-col gap-8">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 min-h-[200px] flex flex-col">
                        <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-6 border-b border-zinc-800 pb-4">Quick Actions</h2>
                        <ul className="flex flex-col gap-3 font-mono text-xs text-blue-400">
                            <li onClick={() => navigate('/calendar')} className="hover:text-white cursor-pointer transition-colors">+ Schedule Meeting</li>
                            <li onClick={() => navigate('/calendar')} className="hover:text-white cursor-pointer transition-colors">+ Register Event</li>
                            <li onClick={() => navigate('/network')} className="hover:text-white cursor-pointer transition-colors">+ Invite User</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
