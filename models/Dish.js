const { Schema, model } = require('mongoose');

const DishSchema = new Schema({
    dish_name: {
        type: String,
        required: true
    },
    dish_description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true });

module.exports = model('Dish', DishSchema);


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