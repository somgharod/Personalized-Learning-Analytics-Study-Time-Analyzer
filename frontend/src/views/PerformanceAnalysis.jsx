// frontend/src/views/PerformanceAnalysis.jsx
/*
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MarksheetUploader from '../components/MarksheetUploader';

const PerformanceAnalysis = () => {
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // NEW: Track whether marksheet data exists
    const [hasData, setHasData] = useState(false);

    const fetchSemesterInsights = useCallback(async (semesterNum) => {
        if (!semesterNum) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/analytics/recommendations/${semesterNum}?user_id=1`
            );

            setInsights(response.data);
        } catch (err) {
            console.error("Error fetching roadmap insights:", err);

            setError(
                `Could not load optimization insights for Semester ${semesterNum}. Ensure your database contains records for this semester.`
            );

            setInsights(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // ONLY fetch if data exists
    useEffect(() => {
        if (hasData) {
            fetchSemesterInsights(selectedSemester);
        }
    }, [selectedSemester, hasData, fetchSemesterInsights]);

    const handleUploadSuccess = (uploadData) => {
        let detectedSem = null;

        if (Array.isArray(uploadData) && uploadData.length > 0) {
            detectedSem =
                uploadData[0].semester ||
                uploadData[0].semester_num;
        } else if (uploadData && uploadData.semester_detected) {
            detectedSem = uploadData.semester_detected;
        }

        setHasData(true);

       if (detectedSem) {
    const numericSem = Number(detectedSem);
    setSelectedSemester(numericSem);
}

            // Immediately fetch analytics after upload
           // fetchSemesterInsights(numericSem);
        }
    };

    const handleStringOrNumSemesterSet = (value) => {
        if (typeof value === "string") {
            const extractedInt = value.replace(/\D/g, "");

            if (extractedInt) {
                setSelectedSemester(Number(extractedInt));
                return;
            }
        }

        if (value) {
            setSelectedSemester(Number(value));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">  */
/* 
            // {/* Header }
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        AI Academic Performance Hub
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Cross-referencing historical scores with targeted syllabus optimization maps.
                    </p>
                </div> 

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-600">
                        Select Semester:
                    </label>

                    <select
                        value={selectedSemester}
                        onChange={(e) =>
                            setSelectedSemester(Number(e.target.value))
                        }
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <option key={sem} value={sem}>
                                Semester {sem}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            

        //    {/* Marksheet Upload }
          <MarksheetUploader
    onUploadSuccess={handleUploadSuccess}
    setSelectedSemester={handleStringOrNumSemesterSet}
/>

            <div className="mt-8">

              //  {/* Initial Upload Prompt *}
                {!hasData && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                            <h3 className="text-xl font-bold text-blue-800 mb-3">
                                Upload a Marksheet to Begin Analysis
                            </h3>

                            <p className="text-blue-600">
                                Upload your academic marksheet to generate
                                AI-powered performance insights, weak subject
                                analysis, semester recommendations, and study
                                improvement strategies.
                            </p>
                        </div>
                    </div>
                )}

               // {/* Loading }
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-pulse flex space-x-4 w-full max-w-2xl">
                            <div className="rounded-full bg-slate-200 h-10 w-10"></div>

                            <div className="flex-1 space-y-6 py-1">
                                <div className="h-2 bg-slate-200 rounded w-48"></div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                                        <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                                    </div>

                                    <div className="h-2 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

           //     {/* Error State }
                {hasData && error && !loading && (
                    <div className="text-center py-10 max-w-xl mx-auto">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
                            <h3 className="text-lg font-bold">
                                Data Synchronization Flag
                            </h3>

                            <p className="text-sm text-amber-600 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

              //  {/* Insights }
                {insights &&
                    insights.metrics_overview &&
                    !loading && (
                        <div className="space-y-8">

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Total Subjects
                                    </p>

                                    <p className="text-2xl font-black text-gray-800 mt-1">
                                        {insights.metrics_overview.total_subjects ||
                                            insights.metrics_overview.total_subjects_parsed ||
                                            0}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Failed Subjects
                                    </p>

                                    <p className="text-2xl font-black text-red-500 mt-1">
                                        {insights.metrics_overview.failed_count || 0}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Weak Subjects
                                    </p>

                                    <p className="text-2xl font-black text-amber-500 mt-1">
                                        {insights.metrics_overview.weak_count || 0}
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Strong Subjects
                                    </p>

                                    <p className="text-2xl font-black text-emerald-500 mt-1">
                                        {insights.metrics_overview.strong_count || 0}
                                    </p>
                                </div>
                            </div>

                          //  {/* Roadmap }
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Actionable Subject Remediation & Boosters
                                </h2>

                                <div className="grid grid-cols-1 gap-6">

                                    {insights.targeted_roadmap &&
                                    insights.targeted_roadmap.length > 0 ? (

                                        insights.targeted_roadmap.map(
                                            (course, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white rounded-xl shadow-sm border p-6"
                                                >
                                                    <h3 className="text-lg font-bold">
                                                        {course.course_name ||
                                                            course.subject_name}
                                                    </h3>

                                                    <p className="mt-2 text-gray-600">
                                                        {course.tactical_advice}
                                                    </p>
                                                </div>
                                            )
                                        )

                                    ) : (
                                        <div className="bg-white border rounded-xl p-8 text-center text-gray-500 shadow-sm">
                                       //     🎉 No critical gaps found for this semester.
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default PerformanceAnalysis;

*/

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MarksheetUploader from '../components/MarksheetUploader';

const PerformanceAnalysis = () => {
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasData, setHasData] = useState(false);

    const fetchSemesterInsights = useCallback(async (semesterNum) => {
        if (!semesterNum) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/analytics/recommendations/${semesterNum}?user_id=1`
            );
            setInsights(response.data);
        } catch (err) {
            console.error("Error fetching insights:", err);
            setError(`Could not load insights for Semester ${semesterNum}.`);
            setInsights(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasData) {
            fetchSemesterInsights(selectedSemester);
        }
    }, [selectedSemester, hasData, fetchSemesterInsights]);

    const handleUploadSuccess = (uploadData) => {
        let detectedSem = null;
        if (Array.isArray(uploadData) && uploadData.length > 0) {
            detectedSem = uploadData[0].semester || uploadData[0].semester_num;
        } else if (uploadData && uploadData.semester_detected) {
            detectedSem = uploadData.semester_detected;
        }
        if (detectedSem) {
            setSelectedSemester(Number(detectedSem));
        }
        setHasData(true);
    };

    const handleSemesterSet = (value) => {
        if (typeof value === "string") {
            const extracted = value.replace(/\D/g, "");
            if (extracted) {
                setSelectedSemester(Number(extracted));
                return;
            }
        }
        if (value) {
            setSelectedSemester(Number(value));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        AI Academic Performance Hub
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload your marksheet to get AI-powered study recommendations.
                    </p>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-600">Select Semester:</label>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(Number(e.target.value))}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Uploader */}
            <MarksheetUploader
                onUploadSuccess={handleUploadSuccess}
                setSelectedSemester={handleSemesterSet}
                refreshDashboardData={() => fetchSemesterInsights(selectedSemester)}
            />

            {/* Results */}
            <div className="mt-8">

                {/* Initial state - no data yet */}
                {!hasData && !loading && (
                    <div className="text-center py-16 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">Upload your marksheet above to see results</p>
                        <p className="text-sm mt-1">AI will analyze your performance and suggest topics to focus on</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        <p className="ml-3 text-indigo-600 font-medium">Loading insights...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="text-center py-10 max-w-xl mx-auto">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
                            <h3 className="text-lg font-bold">Could not load data</h3>
                            <p className="text-sm text-amber-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {insights && insights.metrics_overview && !loading && (
                    <div className="space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Subjects</p>
                                <p className="text-2xl font-black text-gray-800 mt-1">
                                    {insights.metrics_overview.total_subjects || 0}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Failed</p>
                                <p className={`text-2xl font-black mt-1 ${insights.metrics_overview.failed_count > 0 ? "text-red-500" : "text-gray-800"}`}>
                                    {insights.metrics_overview.failed_count || 0}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Needs Focus</p>
                                <p className={`text-2xl font-black mt-1 ${insights.metrics_overview.weak_count > 0 ? "text-amber-500" : "text-gray-800"}`}>
                                    {insights.metrics_overview.weak_count || 0}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Strong</p>
                                <p className="text-2xl font-black text-emerald-500 mt-1">
                                    {insights.metrics_overview.strong_count || 0}
                                </p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Subject Recommendations
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                {insights.targeted_roadmap && insights.targeted_roadmap.length > 0 ? (
                                    insights.targeted_roadmap.map((course, index) => {
                                        const isCritical = course.status === "Critical Remedial" ||
                                            course.status?.toLowerCase().includes("critical");
                                        return (
                                            <div
                                                key={index}
                                                className={`bg-white rounded-xl shadow-sm border p-6
                                                    ${isCritical
                                                        ? 'border-l-8 border-l-red-500 border-gray-200'
                                                        : 'border-l-8 border-l-amber-500 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            {course.course_name || course.subject_name}
                                                        </h3>
                                                        <span className={`inline-block text-xs font-bold uppercase px-2.5 py-0.5 rounded-full mt-1
                                                            ${isCritical
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {course.status || "Focus Required"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {course.core_failure_insights && (
                                                    <div className="mb-4 bg-red-50 rounded-lg p-3 border border-red-100">
                                                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide">
                                                            Key Issue:
                                                        </h4>
                                                        <p className="text-sm text-red-700 mt-1">
                                                            {course.core_failure_insights}
                                                        </p>
                                                    </div>
                                                )}

                                                {course.high_yield_scoring_topics && course.high_yield_scoring_topics.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                                                            Topics to Focus On:
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {course.high_yield_scoring_topics.map((topic, tIdx) => (
                                                                <span key={tIdx} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-semibold">
                                                                    🎯 {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {course.tactical_advice && (
                                                    <div className="border-t border-dashed border-gray-200 pt-3 text-sm text-indigo-700 bg-indigo-50 -mx-6 -mb-6 p-4 rounded-b-xl">
                                                        <strong>Tip:</strong> {course.tactical_advice}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-white border rounded-xl p-8 text-center text-gray-500 shadow-sm">
                                        🎉 Great performance! No critical gaps found for this semester.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceAnalysis;