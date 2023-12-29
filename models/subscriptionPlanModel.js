const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
    },
    duration: {
        type: String,
    },
    price: {
        type: Number,
    },
    features: {
        type: [String],
    },
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
