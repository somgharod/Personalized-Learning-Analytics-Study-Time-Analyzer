// frontend/src/components/Navbar.jsx

import React from 'react';

const Navbar = ({ currentView }) => {
    // Helper function to render page section contexts nicely in human-readable terms
    const getPageTitle = () => {
        switch (currentView) {
            case 'dashboard': return 'System Summary Overview';
            case 'performance': return 'AI Performance Hub';
            case 'time': return 'Study Time Analyzer';
            case 'profile': return 'User Profile Configuration';
            default: return 'Workspace Hub';
        }
    };

    return (
        <header className="w-full h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
            {/* Context Title Header */}
            <div>
                <h2 className="text-md font-bold text-gray-800 tracking-tight transition-all duration-150">
                    {getPageTitle()}
                </h2>
            </div>

            {/* Right Side Status Panel Metrics */}
            <div className="flex items-center gap-4">
                {/* Server Network Sync Connection Status Indicator */}
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    FastAPI Online
                </div>

                {/* Vertical Divider Asset */}
                <div className="h-6 w-px bg-gray-200"></div>

                {/* Profile Snapshot circle widget icon */}
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-gray-200 group-hover:border-indigo-500 transition-colors flex items-center justify-center font-bold text-xs text-gray-600">
                        🎓
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;