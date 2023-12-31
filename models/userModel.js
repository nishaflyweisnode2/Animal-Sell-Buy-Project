const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    image: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    otp: {
        type: String,
    },
    otpExpiration: {
        type: Date,
    },
    accountVerification: {
        type: Boolean,
        default: false
    },
    completeProfile: {
        type: Boolean,
        default: false,
    },
    currentLocation: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
    },
    userType: {
        type: String,
        enum: ["ADMIN", "USER", "PARTNER"],
        default: "User"
    },
    refferalCode: {
        type: String,
    },
    wallet: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    socialType: {
        type: String,
    },
    favouriteAnimal: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Animal',
        }
    ],
    favouriteSeller: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SellerDetails',
        }
    ],
    favouriteAnimalFeed: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AnimalFeed',
        }
    ],
    isBusy: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
