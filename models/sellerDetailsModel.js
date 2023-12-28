const mongoose = require('mongoose');

const sellerDetailsSchema = new mongoose.Schema({
    sellerDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    animal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
    },
    sellerName: {
        type: String,
    },
    postedDate: {
        type: Date,
        default: Date.now,
    },
    flock: {
        type: String,
    },
    age: {
        type: String,
    },
    weight: {
        type: String,
    },
    productDescription: {
        type: String,
    },
    breed: {
        type: String,
    },
    joinedDate: {
        type: String,
    },
    contactNumber: {
        type: String,
    },
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
    },
    address: {
        houseNo: String,
        street: String,
        state: String,
        city: String,
        pincode: String,
    },
    views: {
        type: Number,
        default: 0,
    },
    favorites: {
        type: Number,
        default: 0,
    },
    safetyTips: {
        type: String,
    },
}, { timestamps: true });

const SellerDetails = mongoose.model('SellerDetails', sellerDetailsSchema);

module.exports = SellerDetails;
