// Validation functions
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validateMobile = (mobile) => {
    const re = /^[0-9]{10}$/;
    return re.test(mobile);
};

const validatePassword = (password) => {
    // At least 6 characters
    return password.length >= 6;
};

const validateSurveyData = (data) => {
    const errors = [];
    
    if (!data.flightNumber || data.flightNumber.trim() === '') {
        errors.push('Flight number is required');
    }
    
    if (!data.travelDate) {
        errors.push('Travel date is required');
    }
    
    if (!data.destination || data.destination.trim() === '') {
        errors.push('Destination is required');
    }
    
    if (!data.travelReason) {
        errors.push('Travel reason is required');
    }
    
    if (!data.aircraftSection) {
        errors.push('Aircraft section is required');
    }
    
    if (!data.returnTrips) {
        errors.push('Return trips is required');
    }
    
    return errors;
};

module.exports = {
    validateEmail,
    validateMobile,
    validatePassword,
    validateSurveyData
};