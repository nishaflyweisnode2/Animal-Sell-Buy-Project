const mongoose = require('mongoose');

const animalMelaSchema = new mongoose.Schema({
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    dateAndTimings: {
        type: Date,
    },
    contact: {
        type: String,
    },
    images: [
        {
            img: {
                type: String
            }
        }
    ],
    isPublished: {
        type: Boolean,
        default: false,
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

const AnimalMela = mongoose.model('AnimalMela', animalMelaSchema);

module.exports = AnimalMela;
