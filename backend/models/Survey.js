const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    flightNumber: {
        type: String,
        required: true,
    },
    travelDate: {
        type: Date,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    travelReason: {
        type: String,
        enum: ['Business', 'Leisure', 'Other'],
        required: true,
    },
    aircraftSection: {
        type: String,
        enum: ['First Class', 'Business/Upper Class', 'Economy', 'Tourist'],
        required: true,
    },
    returnTrips: {
        type: String,
        enum: ['1-2', '3-5', '6-10', '11-20', '21+'],
        required: true,
    },
    ratings: {
        parkingFacility: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
        checkIn: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
        washroomCleanliness: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
        securityCheck: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
        fnbRetail: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
        boardingGate: {
            rating: { type: String, enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Did Not Notice/Use'] },
            comments: String,
        },
    },
    additionalComments: {
        type: String,
    },
    airportCode: {
        type: String,
        required: true,
    },
    submissionDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Survey', surveySchema);