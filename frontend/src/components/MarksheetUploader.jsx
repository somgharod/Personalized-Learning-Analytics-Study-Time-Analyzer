// frontend/src/components/MarksheetUploader.jsx

import React, { useState, useRef } from 'react';
import axios from 'axios';

const MarksheetUploader = ({ onUploadSuccess, setSelectedSemester }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadMetrics, setUploadMetrics] = useState(null);
    const fileInputRef = useRef(null);

    // Handle drag states
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    // Process file drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndUploadFile(e.dataTransfer.files[0]);
        }
    };

    // Process file click selection alternate
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndUploadFile(e.target.files[0]);
        }
    };

    // Validate types and post to backend
    const validateAndUploadFile = async (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];

        if (!allowedExtensions.includes(ext)) {
            setError("Invalid format. Please drop a valid PDF or Image file (PNG/JPG).");
            return;
        }

        setError(null);
        setLoading(true);
        setUploadMetrics(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Adjust port configuration to match your FastAPI instance local bind address
            const response = await axios.post("http://localhost:8000/api/v1/marksheet/upload?user_id=1", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const responseData = response.data;
            console.log("Upload Engine Server Response Data:", responseData);
            
            // --- CRITICAL AUTO-REFRESH & SEMESTER FOCUS LAYER ---
            let detectedSem = null;
            let totalSubjects = 0;
            let normalizedPayload = responseData;

            // 1. Fallback normalization if the backend responds directly with an array of parsed units
            if (Array.isArray(responseData)) {
                if (responseData.length > 0) {
                    detectedSem = responseData[0].semester || responseData[0].semester_num;
                    totalSubjects = responseData.length;
                }
                normalizedPayload = {
                    semester_detected: detectedSem || 1,
                    total_subjects_parsed: totalSubjects,
                    critical_alerts: { failed_subjects: [], low_focus_subjects: [] }
                };
            } else if (responseData) {
                detectedSem = responseData.semester_detected;
                totalSubjects = responseData.total_subjects_parsed || responseData.total_subjects || 0;
            }

            // Sync metrics to display local completion dialog box
            setUploadMetrics({
                semester_detected: detectedSem || 1,
                total_subjects_parsed: totalSubjects,
                critical_alerts: responseData.critical_alerts || { failed_subjects: [], low_focus_subjects: [] }
            });

            // 2. Automatically sync parent component state selection structures
           // 2. Automatically sync parent component state selection structures
if (detectedSem && setSelectedSemester) {
    setSelectedSemester(Number(detectedSem));
}

// 3. Notify parent component
if (onUploadSuccess) {
    onUploadSuccess(normalizedPayload);
}

            // 4. Force state container queries to update in background
           
            // -----------------------------------------------------

        } catch (err) {
            console.error("Upload error execution details:", err);
            setError(
                err.response?.data?.detail || 
                "An unexpected communication breakdown occurred while analyzing your marksheet file."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Academic Marksheet</h2>
            <p className="text-sm text-gray-500 mb-6">
                Our AI engine will parse your semester metrics, flags weakness structures, and configure personalized focus areas.
            </p>

            {/* Drag & Drop Box Layer Container */}
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current.click()}
                className={`relative w-full p-8 text-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center
                    ${isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-gray-300 bg-gray-50 hover:bg-gray-100/70"}
                    ${loading ? "opacity-60 pointer-events-none" : ""}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    disabled={loading}
                />

                {/* Cloud Icon Asset Representation */}
                <svg className={`w-12 h-12 mb-4 ${isDragActive ? "text-indigo-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                {loading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                        <p className="text-sm font-medium text-indigo-600 animate-pulse">AI is parsing your document scores... Please hold.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-base font-semibold text-gray-700">
                            Drag and drop your marksheet layout file here, or <span className="text-indigo-600 underline">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Supports PDF, PNG, JPG, or JPEG formats.</p>
                    </>
                )}
            </div>

            {/* Status Alert Blocks Rendering */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
                    <span className="font-bold">Parsing Issue:</span> {error}
                </div>
            )}

            {uploadMetrics && uploadMetrics.semester_detected && (
                <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-800 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-bold text-base">Analysis Complete!</span>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                        Detected performance tracking for <span className="font-bold">Semester {uploadMetrics.semester_detected}</span> ({uploadMetrics.total_subjects_parsed || 0} subjects mapped).
                    </p>
                    
                    {/* Critical Alert Highlights */}
                    {uploadMetrics.critical_alerts && (uploadMetrics.critical_alerts.failed_subjects?.length > 0 || uploadMetrics.critical_alerts.low_focus_subjects?.length > 0) ? (
                        <div className="text-xs space-y-1">
                            {uploadMetrics.critical_alerts.failed_subjects?.map((s, idx) => (
                                <div key={idx} className="text-red-600 font-medium">⚠️ Action Needed: Remedial blueprint ready for {s}</div>
                            ))}
                            {uploadMetrics.critical_alerts.low_focus_subjects?.map((s, idx) => (
                                <div key={idx} className="text-amber-600 font-medium">⚡ Focus Required: Score optimization roadmap built for {s}</div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-emerald-600 font-medium">🎉 Phenomenal profile record standings! No remediation gaps caught.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MarksheetUploader;