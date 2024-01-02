const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

const animalFeedSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    originalPrice: {
        type: Number
    },
    discountActive: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number
    },
    discountPrice: {
        type: Number
    },
    images: [
        {
            img: {
                type: String
            }
        }
    ],
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
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            name: {
                type: String,
            },
            comment: {
                type: String,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    averageRating: {
        type: Number,
        default: 0,
    },
    numOfUserReviews: {
        type: Number,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

animalFeedSchema.plugin(mongoosePaginate);
animalFeedSchema.plugin(mongooseAggregatePaginate);

const AnimalFeed = mongoose.model('AnimalFeed', animalFeedSchema);

module.exports = AnimalFeed;
