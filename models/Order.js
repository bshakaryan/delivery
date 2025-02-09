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
}, { timestamps: true });

module.exports = model('Order', OrderSchema);


// {
//     _id: 122123,
//     client_id: Id(1),
//     order: [
//         {
//             dish_name: "Burger",
//             quantity: 1
//         }
//         {
//             dish_name: "Fries",
//             quantity: 2
//         }
//     ]
//     price: 12.59
//     created_at: new Date()
//     updated_at: new Date()
// }