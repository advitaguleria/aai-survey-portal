const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: true,
    },
    companyOrganization: {
        type: String,
        required: true,
    },
    employeeIdImage: {
        type: String, // URL to uploaded image
        required: true,
    },
    airportCode: {
        type: String,
        required: true,
    },
    airportName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    // ADD THIS FIELD FOR DEVICE REGISTRATION
    deviceId: {
        type: String,
        required: true,
        unique: true  // This prevents multiple registrations from same device
    },
    isFirstLogin: {
        type: Boolean,
        default: true,
    },
    surveysCompleted: {
        type: Number,
        default: 0,
    },
    lastLogin: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);