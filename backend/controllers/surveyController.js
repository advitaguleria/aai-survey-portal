const Survey = require('../models/Survey');
const User = require('../models/User');

// Submit feedback/survey
exports.submitFeedback = async (req, res) => {
    try {
        console.log('🔧 [BACKEND] Received survey data:', {
            body: req.body,
            userId: req.userId,
        });
        
        const {
            flightNumber,
            travelDate,
            destination,
            travelReason,
            aircraftSection,
            returnTrips,
            ratings,
            additionalComments,
        } = req.body;
        
        console.log('🔧 [BACKEND] Parsed travelDate:', travelDate);
        console.log('🔧 [BACKEND] Ratings structure:', ratings);
        
        // Get user info
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Convert travelDate string to Date object
        const formattedTravelDate = new Date(travelDate);
        if (isNaN(formattedTravelDate.getTime())) {
            return res.status(400).json({ message: 'Invalid travel date format' });
        }
        
        const survey = new Survey({
            userId: req.userId,
            flightNumber,
            travelDate: formattedTravelDate,
            destination,
            travelReason,
            aircraftSection,
            returnTrips,
            ratings, // Make sure this matches your frontend structure
            additionalComments,
            airportCode: user.airportCode,
        });
        
        console.log('🔧 [BACKEND] Survey object to save:', survey);
        
        await survey.save();
        
        // Update user's survey count
        user.surveysCompleted += 1;
        await user.save();
        
        res.status(201).json({
            message: 'Feedback submitted successfully',
            surveyId: survey._id,
        });
    } catch (error) {
        console.error('🔧 [BACKEND] Survey submit error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get user's past submissions
exports.getPastSubmissions = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const surveys = await Survey.find({ userId: req.userId })
            .sort({ submissionDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Survey.countDocuments({ userId: req.userId });
        
        // ⚠️ You might be returning just the array
        // res.json(surveys); // WRONG
        
        // ✅ Should return object with surveys property
        res.json({
            surveys, // <-- This is the array
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const surveysThisMonth = await Survey.countDocuments({
            userId: req.userId,
            submissionDate: { $gte: startOfMonth },
        });
        
        const recentSurveys = await Survey.find({ userId: req.userId })
            .sort({ submissionDate: -1 })
            .limit(5);
        
        res.json({
            totalSurveys: user.surveysCompleted,
            surveysThisMonth,
            recentSurveys,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single survey by ID
exports.getSurveyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const survey = await Survey.findOne({ 
            _id: id, 
            userId: req.userId 
        });
        
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        res.json(survey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};