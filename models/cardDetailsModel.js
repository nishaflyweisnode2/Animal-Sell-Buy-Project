const mongoose = require('mongoose');

const cardDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cardNumber: {
        type: String,
    },
    cardHolderName: {
        type: String,
    },
    expiryDate: {
        type: String,
    },
    cvv: {
        type: String,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isCarSaved: {
        type: Boolean,
        default: false,
    },
});

const CardDetails = mongoose.model('CardDetails', cardDetailsSchema);

module.exports = CardDetails;
