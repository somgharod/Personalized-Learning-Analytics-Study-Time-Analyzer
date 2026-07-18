// frontend/src/services/api.js

import axios from 'axios';

// 1. Instantiate the central global Axios engine configuration profile
const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/* 2. Interceptor Hook Layer (Optional/Robust Preparation)
   If you decide to deploy active authentication JWT keys in your auth router later, 
   this interceptor automatically appends the token to every single request on the fly.
*/
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Define Clean, Standardized Endpoint Request Enclaves
export const marksheetAPI = {
    /**
     * Uploads a native raw marksheet document payload via multipart boundary frames
     * @param {File} fileItem - The PDF or image binary object
     * @param {number} userId - The student placeholder tracking ID
     */
    uploadMarksheet: (fileItem, userId = 1) => {
        const formData = new FormData();
        formData.append('file', fileItem);
        return apiClient.post(`/marksheet/upload?user_id=${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export const analyticsAPI = {
    /**
     * Retrieves custom AI structural mapping advice and remediation parameters
     * @param {number} semesterNum - Target term index to extract
     * @param {number} userId - Student context key
     */
    getSemesterRecommendations: (semesterNum, userId = 1) => {
        return apiClient.get(`/analytics/recommendations/${semesterNum}?user_id=${userId}`);
    },
};

export const trackerAPI = {
    /**
     * Submits a fresh real-world study duration tracking block down to the DB
     * @param {Object} sessionPayload - Form model containing subject, topic, start, and end vectors
     * @param {number} userId - User identifier string
     */
    logStudySession: (sessionPayload, userId = 1) => {
        return apiClient.post(`/tracker/log?user_id=${userId}`, sessionPayload);
    },

    /**
       Retrieves unified Pandas aggregate trends, weekly timelines, and time alignment alerts
     * @param {number} userId - Target student index profile parameters
     */
    getTrackerDashboardMetrics: (userId = 1) => {
        return apiClient.get(`/tracker/dashboard?user_id=${userId}`);
    },
};

export const authAPI = {
    /**
     * Sample authentication stub for pipeline validation
     */
    login: (credentials) => apiClient.post('/auth/login', credentials),
    getCurrentUser: () => apiClient.get('/auth/me'),
};

export default apiClient;