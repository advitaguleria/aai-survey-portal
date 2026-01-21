const crypto = require('crypto');

// Generate random password (8 characters)
const generateRandomPassword = () => {
    return crypto.randomBytes(4).toString('hex'); // 8 characters
};

// Generate random password with custom length
const generateRandomPasswordWithLength = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

module.exports = { generateRandomPassword, generateRandomPasswordWithLength };