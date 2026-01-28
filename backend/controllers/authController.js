const User = require('../models/User');
const { sendPasswordEmail } = require('../config/email');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate random password
const generateRandomPassword = () => {
    return crypto.randomBytes(8).toString('hex');
};

// Register user
exports.register = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, companyOrganization, airportCode, airportName, deviceId } = req.body;
        
        // CHECK 1: Check if device already registered
        const existingDevice = await User.findOne({ deviceId });
        if (existingDevice) {
            return res.status(400).json({ 
                message: 'This device is already registered. Please login with your existing account or use a different device.' 
            });
        }
        
        // CHECK 2: Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Generate random password
        const randomPassword = generateRandomPassword();
        
        // Create new user
        const user = new User({
            fullName,
            email,
            mobileNumber,
            companyOrganization,
            employeeIdImage: req.file ? req.file.path : '',
            airportCode,
            airportName,
            password: randomPassword,
            deviceId: deviceId // Store device ID
        });
        
        await user.save();
        
        // Send password via email
        await sendPasswordEmail(email, randomPassword);
        
        res.status(201).json({
            message: 'Registration successful. Password sent to your email.',
            userId: user._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // ✅ Only update lastLogin, NOT isFirstLogin
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                airportCode: user.airportCode,
                airportName: user.airportName,
                surveysCompleted: user.surveysCompleted,
                isFirstLogin: user.isFirstLogin,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        console.log('🔧 [BACKEND] Change password request:', {
            userId: req.userId,
            hasCurrentPassword: !!currentPassword,
            hasNewPassword: !!newPassword,
            currentPasswordLength: currentPassword?.length,
            newPasswordLength: newPassword?.length
        });

        // Find user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('🔧 [BACKEND] User status:', {
            email: user.email,
            isFirstLogin: user.isFirstLogin
        });

        // 🔥 CRITICAL FIX: Skip current password check for first login
        if (!user.isFirstLogin) {
            // Only check current password for NON-first login users
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
        } else {
            // For first login: user doesn't know current password
            // You could optionally verify temporary password here
            // OR just skip verification
            console.log('🔧 [BACKEND] First login - skipping current password check');
        }

        // Update password
        user.password = newPassword;
        user.isFirstLogin = false; // Mark as not first login anymore
        await user.save();

        console.log('🔧 [BACKEND] Password updated successfully for:', user.email);

        res.json({ 
            message: 'Password changed successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isFirstLogin: false,
            },
        });
    } catch (error) {
        console.error('🔧 [BACKEND] Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET + user.password,
            { expiresIn: '1h' }
        );
        
        // Send reset email
        await sendPasswordResetEmail(email, resetToken);
        
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Invalid or expired token' });
    }
};