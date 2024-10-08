const mongoose = require('mongoose');

const publishAdSchema = new mongoose.Schema({
    postBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    species: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    },
    breed: {
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory'
    },
    desc: {
        type: String,
    },
    age: {
        type: String,
    },
    height: {
        type: String,
    },
    weight: {
        type: String,
    },
    length: {
        type: String,
    },
    gender: {
        type: String,
    },
    colour: {
        type: String,
    },
    milkProduction: {
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
    healthCondition: {
        type: String,
    },
    vaccinationStatus: {
        type: String,
    },
    medicalHistory: {
        type: String,
    },
    microchipID: {
        type: String,
    },
    temperament: {
        type: String,
    },
    trainingLevel: {
        type: String,
    },
    socialization: {
        type: String,
    },
    images: [
        {
            img: {
                type: String
            }
        }
    ],
    videos: [
        {
            vid: {
                type: String
            }
        }
    ],
    price: {
        type: String,
    },
    negotiation: {
        type: Boolean,
        default: false,
    },
    reasonForSelling: {
        type: String,
    },
    postDate: {
        type: Date,
        default: Date.now,
    },
    likes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        }
    ],
    dislikes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            text: {
                type: String,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
}, { timestamps: true });

const PublishAd = mongoose.model('PublishAd', publishAdSchema);

module.exports = PublishAd;
