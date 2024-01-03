const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referredUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    referralCode: {
        type: String,
    },
    reward: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
