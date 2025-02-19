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

