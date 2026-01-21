import api from './api';

export const surveyService = {
    submitFeedback: async (surveyData) => {
        console.log('🔧 [DEBUG] Submitting feedback...');
        const response = await api.post('/survey/submit', surveyData);
        console.log('🔧 [DEBUG] Submit response:', response.data);
        return response.data;
    },
    
    getPastSubmissions: async (page = 1, limit = 10) => {
        console.log('🔧 [DEBUG] Fetching past submissions...');
        try {
            const response = await api.get(`/survey/past-submissions?page=${page}&limit=${limit}`);
             return response.data.surveys || [];
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return []; // Always return an array
        }
    },
    
    getDashboardStats: async () => {
        console.log('🔧 [DEBUG] Fetching dashboard stats...');
        const response = await api.get('/survey/dashboard-stats');
        return response.data;
    },
};