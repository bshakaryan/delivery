const { Schema, model } = require('mongoose');

const OrderSchema = new Schema({
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    order: [{
        dish_id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        dish_name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price_per_item: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    price: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        index: {
            expires: 0
        },
        default: null
    },
}, { timestamps: true });

module.exports = model('Order', OrderSchema);