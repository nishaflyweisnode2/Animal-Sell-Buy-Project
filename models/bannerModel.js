const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    link: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
