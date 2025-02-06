const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        unique: true,
    },
    roles: [{
        type: String,
        ref: 'Role',
    }],
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    orders: [{
        type: Number,
    }]
});

module.exports = model('User', UserSchema);