const express = require('express');
const mongoose = require('mongoose');
const { createServer } = require('http');
const authRouter = require('./authRouter');
const app = express();
require('dotenv').config();

app.use(express.json());
app.use("/auth", authRouter);


mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

const server = createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is up port: ${process.env.PORT}`));