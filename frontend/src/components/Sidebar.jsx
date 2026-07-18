// frontend/src/components/Sidebar.jsx

import React from 'react';

const Sidebar = ({ currentView, setCurrentView }) => {
    // Array map containing all sidebar item configuration paths
    const navItems = [
        { id: 'dashboard', label: 'Dashboard Summary', icon: '🏠' },
        { id: 'performance', label: 'Performance Hub', icon: '📑' },
        { id: 'time', label: 'Time Analyzer', icon: '⏱️' },
        { id: 'profile', label: 'Identity Settings', icon: '👤' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 h-full">
            {/* Sidebar Branding Header */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <span className="text-xl">📊</span>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Study Analyzer</h2>
                    <p className="text-xxs text-indigo-400 font-bold tracking-tight mt-0.5">AI/ML Core Edition</p>
                </div>
            </div>

            {/* Navigation Switch Links list */}
            <nav className="flex-1 p-4 space-y-1.5">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150
                            ${currentView === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' 
                                : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <span>{item.icon}</span> {item.label}
                    </button>
                ))}
            </nav>

            {/* Bottom Account Identifier Context */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3 px-2 py-1">
                    <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                        ST
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">Active Student</p>
                        <p className="text-xxs text-slate-500 truncate">Workspace ID #001</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;