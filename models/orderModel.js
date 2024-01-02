const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    animal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
    },
    quantity: {
        type: Number,
        default: 1,
    },
    price: {
        type: Number,
    },
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
    orderId: {
        type: String
    },
    items: [orderItemSchema],
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
    orderStatus: {
        type: String,
        enum: ["Unconfirmed", "Confirmed", "Cancel"],
        default: "Unconfirmed",
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        default: 'Pending',
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    paymentType: {
        type: String,
        enum: ["COD", "UPI", "Net Banking & Cards", "User Wallet",],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
