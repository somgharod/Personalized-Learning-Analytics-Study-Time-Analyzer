// frontend/src/views/Profile.jsx

import React from 'react';

const Profile = () => {
    // Structural client mock profile dataset details
    const studentProfile = {
        name: "Active Workspace Student",
        email: "student@university.edu",
        institution: "Global Institute of Technology",
        enrollmentId: "GIT-2026-8842",
        currentSemester: 3,
        accountTier: "AI Premium Engine Mapped"
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* Header Layout */}
            <div className="mb-8 border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Identity Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage local workspace configurations, registry numbers, and platform authorization flags.</p>
            </div>

            <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Identity Cover Accent Banner */}
                <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-950 p-6 flex items-end">
                    <div className="flex items-center gap-4 transform translate-y-10">
                        <div className="h-20 w-20 rounded-2xl bg-indigo-600 border-4 border-white text-white text-2xl font-black shadow-md flex items-center justify-center">
                            ST
                        </div>
                    </div>
                </div>

                {/* Profile Data Layout Grid */}
                <div className="pt-14 p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{studentProfile.name}</h2>
                        <p className="text-sm text-indigo-600 font-semibold mt-0.5">{studentProfile.accountTier}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-sm">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Academic Email Address</span>
                            <span className="font-semibold text-gray-700 mt-0.5 block">{studentProfile.email}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Campus Affiliation</span>
                            <span className="font-semibold text-gray-700 mt-0.5 block">{studentProfile.institution}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Registry Enrollment Token</span>
                            <span className="font-mono font-semibold text-gray-700 mt-0.5 block">{studentProfile.enrollmentId}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Active Registry Tracking Term</span>
                            <span className="font-semibold text-gray-700 mt-0.5 block">Semester {studentProfile.currentSemester}</span>
                        </div>
                    </div>

                    {/* Extra configuration settings block placeholder */}
                    <div className="border-t border-gray-100 pt-5 flex justify-end">
                        <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all">
                            Modify Workspace Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;