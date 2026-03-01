import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
    const { user, isAuthenticated, isInitializing } = useAuth();

    // Prevent flashing unauthenticated state while localStorage loads
    if (isInitializing) {
        return <div className="h-screen w-full bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div></div>;
    }
    6666
    // Security catch: If somehow they get here unauthenticated, bounce them
    if (!isAuthenticated) return <Navigate to="/" replace />;

    // Security catch: If they are authenticated but have no company_id, bounce to Limbo
    if (!user?.company_id) return <Navigate to="/limbo" replace />;

    return (
        <div className="flex h-screen w-full bg-zinc-950 font-sans text-white overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 h-full overflow-hidden relative">
                <TopBar />

                {/* Main Content Scroll Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-950 relative">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none opacity-50 block w-[80%] h-[80%] top-[-10%] left-[-10%]"></div>

                    <div className="relative z-10 w-full h-full p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
