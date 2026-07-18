// frontend/src/App.jsx

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';  // Imported from fresh file
import Navbar from './components/Navbar';    // Imported from fresh file
import Dashboard from './views/Dashboard';
import PerformanceAnalysis from './views/PerformanceAnalysis';
import TimeAnalyzer from './views/TimeAnalyzer';
import Profile from './views/Profile';

const App = () => {
    // Tracks current global component presentation frame state
    const [currentView, setCurrentView] = useState('dashboard');

    return (
        <div className="flex h-screen bg-gray-100 font-sans antialiased overflow-hidden">
            
            {/* 1. Modular Sidebar Panel Insertion */}
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

            {/* Master Application Layout Column container */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* 2. Top-Level Modular Utility Sticky Navbar Insertion */}
                <Navbar currentView={currentView} />

                {/* 3. Main Scrollable Dashboard Content Presentation Enclave */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto animate-fadeIn">
                        {currentView === 'dashboard' && <Dashboard />}
                        {currentView === 'performance' && <PerformanceAnalysis />}
                        {currentView === 'time' && <TimeAnalyzer />}
                        {currentView === 'profile' && <Profile />}
                    </div>
                </main>
                
            </div>
        </div>
    );
};

export default App;