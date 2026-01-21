const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    airportCode: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['General', 'Infrastructure', 'Services', 'Staff', 'Facilities', 'Security', 'Other'],
        default: 'General',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Pending', 'In Review', 'Resolved', 'Closed'],
        default: 'Pending',
    },
    attachments: [{
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    response: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        respondedAt: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field on save
feedbackSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get feedback by status
feedbackSchema.statics.findByStatus = function(status) {
    return this.find({ status });
};

// Static method to get feedback by airport
feedbackSchema.statics.findByAirport = function(airportCode) {
    return this.find({ airportCode });
};

// Static method to get user's feedback
feedbackSchema.statics.findByUser = function(userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

// Method to mark as resolved
feedbackSchema.methods.markAsResolved = function(response, userId) {
    this.status = 'Resolved';
    this.response = {
        message: response,
        respondedBy: userId,
        respondedAt: new Date(),
    };
    return this.save();
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback; 