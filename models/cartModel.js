const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    animal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
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
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [cartItemSchema],
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    },
    isCouponApply: {
        type: Boolean,
        defalut: false
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

module.exports = Cart;
