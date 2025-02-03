const express = require('express');
const mongoose = require('mongoose');
const { createServer } = require('http');
const app = express();
require('dotenv').config();

mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

const UserSchema = new mongoose.Schema({
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
    }
});

const User = mongoose.model('user', UserSchema);

app.get('/', (req, res) => {
    User.create({
        name: "Bogdan",
        email: "bogdan@test.com",
        address: "Uly Dala 82",
        phone: "+77081891601",
    })
    .then((user) => res.send(user))
    .catch((err) => res.send(err));
});

const server = createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is up port: ${process.env.PORT}`));