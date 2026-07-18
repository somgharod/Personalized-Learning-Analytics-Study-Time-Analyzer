// frontend/src/views/TimeAnalyzer.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StudyTimer from '../components/StudyTimer';

const TimeAnalyzer = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch analytical aggregates from backend endpoint
    const fetchTrackerDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            // Points directly to the Pandas-driven FastAPI aggregation worker
            const response = await axios.get("http://localhost:8000/api/v1/tracker/dashboard?user_id=1");
            setMetrics(response.data);
        } catch (err) {
            console.error("Dashboard engine network error:", err);
            setError("Unable to compute telemetry aggregates. Verify your database and server status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackerDashboard();
    }, []);

    // Configuration for Pie Chart color wheels
    const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ec4899'];

    // Convert preferred slots JSON object to an array compatible with Recharts rendering
    const formatPieData = (slotsObj) => {
        if (!slotsObj) return [];
        return Object.keys(slotsObj).map(key => ({
            name: key,
            value: slotsObj[key] / 60 // Convert raw database minutes to cleanly displayed hours
        })).filter(item => item.value > 0);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* Header Area */}
            <div className="mb-8 border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Study Time Analyzer</h1>
                <p className="text-sm text-gray-500 mt-1">AI-driven scheduling analysis matching actual study allocation against academic needs.</p>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Live Control Timer Hub */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Session Control Panel</h3>
                        {/* Passes our custom data-refresh callback directly into the stopwatch interface */}
                        <StudyTimer onLogComplete={fetchTrackerDashboard} />
                    </div>
                    
                    {/* Real-time ML Cross-Reference Alignment Alerts */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <span className="mr-2">🧠</span> AI Time Alignment Alerts
                        </h3>
                        <div className="space-y-3">
                            {metrics?.alignment_alerts && metrics.alignment_alerts.length > 0 ? (
                                metrics.alignment_alerts.map((alert, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-3.5 rounded-xl text-xs border font-medium
                                            ${alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-700' : 
                                              alert.severity === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                                              'bg-blue-50 border-blue-100 text-blue-700'}`}
                                    >
                                        <div className="font-bold uppercase mb-1 tracking-wide">{alert.severity} Threshold breach</div>
                                        {alert.message}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">No time deficits detected. Your logged hours align nicely with your academic performance goals!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Columns: Data Graphs Hub */}
                <div className="lg:col-span-2 space-y-8">
                    {loading ? (
                        <div className="bg-white p-12 rounded-2xl text-center text-gray-400 border border-gray-100 animate-pulse">
                            Recalculating time metrics... Please wait.
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-700 border border-red-200 p-6 rounded-2xl text-center">
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Summary Metric Strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Time Mapped</p>
                                    <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.summary.total_study_time_hours} hrs</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Days Logged Active</p>
                                    <p className="text-2xl font-black text-gray-800 mt-1">{metrics.summary.active_days_tracked} Days</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Peak Productivity Slot</p>
                                    <p className="text-2xl font-black text-emerald-500 mt-1">{metrics.summary.peak_productivity_slot}</p>
                                </div>
                            </div>

                            {/* Chart Panels Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Bar Chart: Past 7 Days Distribution */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-80">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Weekly Study History</h4>
                                    <div className="flex-1 w-full text-xs">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={metrics.weekly_timeline_chart}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" tickLine={false} />
                                                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} tickLine={false} />
                                                <Tooltip />
                                                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart: Preferred Slots Distribution */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-80">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Preferred Study Slots</h4>
                                    <div className="flex-1 w-full text-xs relative">
                                        {formatPieData(metrics.preferred_study_slots).length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={formatPieData(metrics.preferred_study_slots)}
                                                        cx="50%"
                                                        cy="45%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {formatPieData(metrics.preferred_study_slots).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `${value.toFixed(1)} hrs`} />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center py-20 text-gray-400 italic">Insufficient active logs to chart temporal preferences.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Granular Table Layout: Detailed Subject & Topic Distribution */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Total Study Time per Topic Breakdown</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase font-semibold">
                                                <th className="py-3 px-4">Subject</th>
                                                <th className="py-3 px-4">Topic</th>
                                                <th className="py-3 px-4 text-right">Time Invested</th>
                                                <th className="py-3 px-4 text-right">Allocation Share</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                            {metrics.topic_granular_breakdown.length > 0 ? (
                                                metrics.topic_granular_breakdown.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-gray-900">{row.subject}</td>
                                                        <td className="py-3 px-4 text-gray-500">{row.topic}</td>
                                                        <td className="py-3 px-4 text-right">{(row.total_minutes / 60).toFixed(1)} hrs</td>
                                                        <td className="py-3 px-4 text-right text-indigo-600 font-bold">{row.percentage_of_total}%</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="py-8 text-center text-gray-400 italic">No micro-topic data logged yet. Complete a timed session to populate table trends.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimeAnalyzer;