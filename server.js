const express = require('express');
const mongoose = require('mongoose');
const { createServer } = require('http');
const bcrypt = require('bcryptjs');
const authRouter = require('./authRouter');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const authController = require('./authController');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middlewaree/authMiddleware');
const { secret } = require("./config");
const User = require("./models/User");
const Order = require("./models/Order");
const Dish = require("./models/Dish");
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const roleMiddleware = require('./middlewaree/roleMiddleware');
const upload = require('./middlewaree/upload');
const checkRoleMiddleware = require('./middlewaree/checkRoleMiddleware');
require('dotenv').config();

app.use(flash());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use("/auth", authRouter);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(session({
    secret: 'your-secret-key',  // Секрет для сессий
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    next();
});

mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
}).then(() => console.log('MongoDB connected')).catch((err) => console.log(err));

// Load user and admin routes (the route definitions are now in separate files)
const userRoutes = require('./routes/user_routes');
const adminRoutes = require('./routes/admin_routes');

app.use('/', userRoutes);
app.use('/', adminRoutes);

// Home (index) route remains in server.js
app.get('/', (req, res) => {
    res.render("index");
});

const server = createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is up port: ${process.env.PORT}`));
