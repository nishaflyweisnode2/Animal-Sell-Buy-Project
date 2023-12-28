const mongoose = require('mongoose');
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");


const animalSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    },
    subCategory: {
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    images: [
        {
            img: {
                type: String
            }
        }
    ],
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
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
    breed: {
        type: String,
    },
    age: {
        type: String,
    },
    height: {
        type: String,
    },
    length: {
        type: String,
    },
    weight: {
        type: String,
    },
    milkProduction: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0,
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
            rating: {
                type: Number,
            },
            comment: {
                type: String,
            },
        },
    ],
    numOfUserReviews: {
        type: Number,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

animalSchema.plugin(mongoosePaginate);
animalSchema.plugin(mongooseAggregatePaginate);

const Animal = mongoose.model('Animal', animalSchema);

module.exports = Animal;
