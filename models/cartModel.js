const mongoose = require('mongoose');

const cartItemBaseSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['animal', 'animalFeed'],
            // required: true,
        },
        price: {
            type: Number,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { discriminatorKey: 'kind', _id: false }
);

const animalCartItemSchema = new mongoose.Schema({
    animal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
    },
}, { _id: false });

const animalFeedCartItemSchema = new mongoose.Schema({
    animalFeed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AnimalFeed',
    },
}, { _id: false });

const AnimalCartItem = mongoose.model('AnimalCartItem', animalCartItemSchema);
const AnimalFeedCartItem = mongoose.model('AnimalFeedCartItem', animalFeedCartItemSchema);

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [cartItemBaseSchema],
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    },
    isCouponApply: {
        type: Boolean,
        default: false,
    },
    couponCode: {
        type: String,
    },
    discount: {
        type: Number,
    },
    subTotal: {
        type: Number,
        default: 0,
    },
    shipping: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = {
    Cart,
    AnimalCartItem,
    AnimalFeedCartItem,
};
