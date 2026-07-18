import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const StudyTimer = ({ onLogComplete }) => {
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [subjectName, setSubjectName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [noMarksheet, setNoMarksheet] = useState(false);

    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    // Fetch subjects from marksheet on mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/tracker/subjects?user_id=1');
                if (res.data.subjects && res.data.subjects.length > 0) {
                    setSubjects(res.data.subjects);
                    setNoMarksheet(false);
                } else {
                    setNoMarksheet(true);
                }
            } catch (err) {
                console.error('Failed to fetch subjects:', err);
                setNoMarksheet(true);
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTime((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, isPaused]);

    const formatTime = () => {
        const s = `0${time % 60}`.slice(-2);
        const m = `0${Math.floor(time / 60) % 60}`.slice(-2);
        const h = `0${Math.floor(time / 3600)}`.slice(-2);
        return `${h}:${m}:${s}`;
    };

    const getProgressPercent = () => {
        const target = 3600; // 1 hour target
        return Math.min((time / target) * 100, 100);
    };

    const handleStart = () => {
        if (!subjectName.trim() || !topicName.trim()) {
            setStatusMessage({ type: 'error', text: 'Please select a subject and enter a topic.' });
            return;
        }
        setStatusMessage(null);
        setIsActive(true);
        setIsPaused(false);
        startTimeRef.current = new Date();
    };

    const handlePauseResume = () => setIsPaused(!isPaused);

    const handleStopAndSave = async () => {
        if (time < 10) {
            setStatusMessage({ type: 'error', text: 'Session too short. Please study for at least 10 seconds.' });
            resetTimerState();
            return;
        }

        const endTime = new Date();
        const payload = {
            subject_name: subjectName,
            topic_name: topicName,
            start_time: startTimeRef.current.toISOString(),
            end_time: endTime.toISOString()
        };

        try {
            await axios.post('http://localhost:8000/api/v1/tracker/log?user_id=1', payload);
            setStatusMessage({
                type: 'success',
                text: `✅ Session saved! ${Math.round(time / 60)} min logged for ${subjectName}.`
            });
            if (onLogComplete) onLogComplete();
            resetTimerState();
        } catch (err) {
            console.error('Failed to save session:', err);
            setStatusMessage({ type: 'error', text: 'Could not save session. Check backend connection.' });
        }
    };

    const resetTimerState = () => {
        setIsActive(false);
        setIsPaused(false);
        setTime(0);
        setSubjectName('');
        setTopicName('');
        startTimeRef.current = null;
    };

    // Group subjects by semester for dropdown
    const groupedSubjects = subjects.reduce((acc, s) => {
        const key = `Semester ${s.semester}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(s.subject_name);
        return acc;
    }, {});

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            margin: '0 auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#fff' }}>
                        Study Session Tracker
                    </h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                        Linked to your marksheet subjects
                    </p>
                </div>
                <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: isActive && !isPaused ? '#22c55e' : '#374151',
                    boxShadow: isActive && !isPaused ? '0 0 10px #22c55e' : 'none',
                    transition: 'all 0.3s'
                }} />
            </div>

            {/* No marksheet warning */}
            {noMarksheet && !loadingSubjects && (
                <div style={{
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#fbbf24'
                }}>
                    ⚠️ No marksheet uploaded yet. Upload your marksheet in the Performance Hub first to get subject suggestions.
                </div>
            )}

            {/* Subject Dropdown */}
            <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Subject
                </label>
                {loadingSubjects ? (
                    <div style={{ padding: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading subjects...</div>
                ) : (
                    <select
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        disabled={isActive}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '10px',
                            color: subjectName ? '#fff' : 'rgba(255,255,255,0.35)',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: isActive ? 'not-allowed' : 'pointer',
                            opacity: isActive ? 0.6 : 1
                        }}
                    >
                        <option value="" style={{ background: '#1e1b3a' }}>
                            {noMarksheet ? 'Type subject name below...' : 'Select a subject...'}
                        </option>
                        {Object.entries(groupedSubjects).map(([sem, subjs]) => (
                            <optgroup key={sem} label={sem} style={{ background: '#1e1b3a', color: 'rgba(255,255,255,0.5)' }}>
                                {subjs.map((s) => (
                                    <option key={s} value={s} style={{ background: '#1e1b3a', color: '#fff' }}>{s}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                )}
                {/* Manual entry fallback if no marksheet */}
                {noMarksheet && (
                    <input
                        type="text"
                        placeholder="Or type subject name manually..."
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        disabled={isActive}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            marginTop: '8px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                )}
            </div>

            {/* Topic Input */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Topic
                </label>
                <input
                    type="text"
                    placeholder="e.g., Binary Search Trees, Sorting Algorithms..."
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    disabled={isActive}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        opacity: isActive ? 0.6 : 1,
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Timer Display */}
            <div style={{
                textAlign: 'center',
                padding: '28px 20px',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '16px',
                marginBottom: '8px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                {/* Progress bar background */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    height: '3px',
                    width: `${getProgressPercent()}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                    transition: 'width 1s linear',
                    borderRadius: '0 0 16px 16px'
                }} />
                <div style={{
                    fontFamily: 'monospace',
                    fontSize: '48px',
                    fontWeight: '700',
                    letterSpacing: '6px',
                    color: isActive && !isPaused ? '#a78bfa' : 'rgba(255,255,255,0.9)',
                    transition: 'color 0.3s'
                }}>
                    {formatTime()}
                </div>
                {isActive && subjectName && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                        {isPaused ? '⏸ Paused' : '🔴 Recording'} · {subjectName}
                    </div>
                )}
            </div>

            {/* 1 hr target label */}
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>
                Target: 1 hr session
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {!isActive ? (
                    <button
                        onClick={handleStart}
                        style={{
                            flex: 1, padding: '13px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: '12px',
                            color: '#fff', fontWeight: '700', fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            transition: 'transform 0.15s'
                        }}
                        onMouseOver={e => e.target.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                    >
                        ⚡ Start Session
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handlePauseResume}
                            style={{
                                flex: 1, padding: '13px',
                                background: isPaused ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
                                border: isPaused ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(251,191,36,0.3)',
                                borderRadius: '12px',
                                color: isPaused ? '#22c55e' : '#fbbf24',
                                fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                            }}
                        >
                            {isPaused ? '▶ Resume' : '⏸ Pause'}
                        </button>
                        <button
                            onClick={handleStopAndSave}
                            style={{
                                flex: 1, padding: '13px',
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '12px',
                                color: '#ef4444',
                                fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                            }}
                        >
                            🛑 Stop & Save
                        </button>
                    </>
                )}
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'center',
                    background: statusMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: statusMessage.type === 'success' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)',
                    color: statusMessage.type === 'success' ? '#22c55e' : '#ef4444'
                }}>
                    {statusMessage.text}
                </div>
            )}
        </div>
    );
};

export default StudyTimer;