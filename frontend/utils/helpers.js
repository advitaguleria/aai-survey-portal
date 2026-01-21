// Helper functions for the frontend

// Format date to DD-MM-YYYY
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Format date to readable string
export const formatDateReadable = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// Validate email format
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate mobile number (10 digits)
export const validateMobile = (mobile) => {
    const re = /^[0-9]{10}$/;
    return re.test(mobile);
};

// Get rating color based on rating
export const getRatingColor = (rating) => {
    switch (rating) {
        case 'Excellent':
            return '#4CAF50'; // Green
        case 'Very Good':
            return '#8BC34A'; // Light Green
        case 'Good':
            return '#FFC107'; // Amber
        case 'Fair':
            return '#FF9800'; // Orange
        case 'Poor':
            return '#F44336'; // Red
        default:
            return '#9E9E9E'; // Grey for "Did Not Notice/Use"
    }
};

// Calculate average rating from survey
export const calculateAverageRating = (ratings) => {
    const ratingValues = {
        'Excellent': 5,
        'Very Good': 4,
        'Good': 3,
        'Fair': 2,
        'Poor': 1,
        'Did Not Notice/Use': 0,
    };

    let total = 0;
    let count = 0;

    Object.values(ratings).forEach((rating) => {
        if (rating.rating && rating.rating !== 'Did Not Notice/Use') {
            total += ratingValues[rating.rating] || 0;
            count++;
        }
    });

    return count > 0 ? (total / count).toFixed(1) : 'N/A';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Validate flight number format
export const validateFlightNumber = (flightNumber) => {
    const re = /^[A-Z]{2}\d{3,4}$/;
    return re.test(flightNumber.toUpperCase());
};

// Get airport name from code
export const getAirportName = (code, airports) => {
    const airport = airports.find(a => a.code === code);
    return airport ? airport.name : 'Unknown Airport';
};

// Format rating for display
export const formatRating = (rating) => {
    if (!rating || rating === 'Did Not Notice/Use') {
        return 'N/A';
    }
    return rating;
};

// Generate random color for UI
export const getRandomColor = () => {
    const colors = [
        '#1e88e5', '#43a047', '#e53935', '#fb8c00', '#8e24aa',
        '#00acc1', '#5e35b1', '#f4511e', '#546e7a', '#039be5',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Check if object is empty
export const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
};

// Delay function
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Capitalize first letter
export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Parse error message from API response
export const parseErrorMessage = (error) => {
    if (error.response) {
        return error.response.data?.message || error.response.data?.error || 'Server error';
    } else if (error.request) {
        return 'No response from server. Check your connection.';
    } else {
        return error.message || 'An error occurred';
    }
};