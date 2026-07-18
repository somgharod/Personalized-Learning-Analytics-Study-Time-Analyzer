import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatCard = ({ icon, label, value, color, glow }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: glow ? `0 0 30px ${glow}22` : 'none'
    }}>
        <div style={{
            fontSize: '26px',
            padding: '12px',
            borderRadius: '12px',
            background: `${color}15`,
            border: `1px solid ${color}30`,
            lineHeight: 1
        }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: '800', color: color, margin: '4px 0 0' }}>
                {value}
            </p>
        </div>
    </div>
);

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [tracker, setTracker] = useState(null);
    const [latestSemester, setLatestSemester] = useState(1);
    const [loading, setLoading] = useState(true);
    const [noData, setNoData] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // First get tracker to find which semesters exist
                const trackerRes = await axios.get('http://localhost:8000/api/v1/tracker/dashboard?user_id=1');
                setTracker(trackerRes.data);

                // Try semesters 1-8 to find latest with data
                let foundSem = 1;
                let analyticsData = null;
                for (let sem = 8; sem >= 1; sem--) {
                    try {
                        const res = await axios.get(`http://localhost:8000/api/v1/analytics/recommendations/${sem}?user_id=1`);
                        if (res.data && res.data.metrics_overview && res.data.metrics_overview.total_subjects > 0) {
                            analyticsData = res.data;
                            foundSem = sem;
                            break;
                        }
                    } catch { continue; }
                }

                if (analyticsData) {
                    setAnalytics(analyticsData);
                    setLatestSemester(foundSem);
                    setNoData(false);
                } else {
                    setNoData(true);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const totalHours = tracker?.summary?.total_study_time_hours || 0;
    const alerts = tracker?.alignment_alerts || [];
    const failed = analytics?.metrics_overview?.failed_count || 0;
    const weak = analytics?.metrics_overview?.weak_count || 0;
    const strong = analytics?.metrics_overview?.strong_count || 0;
    const total = analytics?.metrics_overview?.total_subjects || 0;
    const standing = analytics?.academic_standing || '—';
    const failedList = analytics?.categorized_breakdown?.critical_remedial_required || [];
    const weakList = analytics?.categorized_breakdown?.low_focus_areas || [];
    const strongList = analytics?.categorized_breakdown?.mastered_domains || [];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #0a0a1a 0%, #111128 50%, #0d0d1f 100%)',
            padding: '32px 24px',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '6px 0 0' }}>
                    {noData ? 'Upload your marksheet to see your academic snapshot.' : `Showing data for Semester ${latestSemester}`}
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
                    Loading your dashboard...
                </div>
            ) : noData ? (
                /* No data state */
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px',
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>No Marksheet Data Yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
                        Go to the <strong style={{ color: '#a78bfa' }}>Performance Hub</strong> and upload your semester marksheet to see personalized insights here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <StatCard icon="📚" label="Total Subjects" value={total} color="#a78bfa" glow="#a78bfa" />
                        <StatCard icon="⏱️" label="Study Hours Logged" value={`${totalHours}h`} color="#60a5fa" glow="#60a5fa" />
                        <StatCard icon="✅" label="Strong Subjects" value={strong} color="#22c55e" glow="#22c55e" />
                        <StatCard icon="⚠️" label="Needs Attention" value={failed + weak} color={failed + weak > 0 ? '#f59e0b' : '#22c55e'} glow={failed + weak > 0 ? '#f59e0b' : null} />
                    </div>

                    {/* Academic Standing Banner */}
                    <div style={{
                        padding: '20px 24px',
                        borderRadius: '16px',
                        background: failed > 0
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))'
                            : weak > 0
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))'
                            : 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))',
                        border: `1px solid ${failed > 0 ? 'rgba(239,68,68,0.25)' : weak > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                    }}>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Standing — Semester {latestSemester}</p>
                            <p style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: failed > 0 ? '#ef4444' : weak > 0 ? '#f59e0b' : '#22c55e' }}>
                                {standing}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Failed', count: failed, color: '#ef4444' },
                                { label: 'Weak', count: weak, color: '#f59e0b' },
                                { label: 'Strong', count: strong, color: '#22c55e' }
                            ].map(item => (
                                <div key={item.label} style={{ textAlign: 'center', padding: '8px 16px', background: `${item.color}15`, borderRadius: '10px', border: `1px solid ${item.color}30` }}>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: item.color }}>{item.count}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                        {/* Failed subjects */}
                        {failedList.length > 0 && (
                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🚨 Failed Subjects
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {failedList.map((s, i) => (
                                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', borderLeft: '3px solid #ef4444' }}>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weak subjects */}
                        {weakList.length > 0 && (
                            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ⚡ Needs Focus
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {weakList.map((s, i) => (
                                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', borderLeft: '3px solid #f59e0b' }}>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong subjects */}
                        {strongList.length > 0 && (
                            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#22c55e', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ✅ Strong Subjects
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {strongList.map((s, i) => (
                                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', borderLeft: '3px solid #22c55e' }}>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Study Alerts from Tracker */}
                    {alerts.length > 0 && (
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#818cf8', margin: '0 0 14px' }}>
                                🎯 Study Pattern Alerts ({alerts.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {alerts.map((alert, i) => (
                                    <div key={i} style={{
                                        padding: '10px 14px',
                                        background: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                                        border: alert.severity === 'CRITICAL' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        color: 'rgba(255,255,255,0.8)'
                                    }}>
                                        {alert.message || alert}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {alerts.length === 0 && !noData && (
                        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#22c55e', fontSize: '14px', margin: 0 }}>✅ No study pattern alerts. Keep up the good work!</p>
                        </div>
                    )}

                    {/* Quick tip */}
                    <div style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                    }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Next Step</p>
                            <p style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                                Go to <span style={{ color: '#a78bfa' }}>Performance Hub</span> to see detailed subject recommendations, or use the <span style={{ color: '#60a5fa' }}>Time Analyzer</span> to log your study sessions.
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Dashboard;