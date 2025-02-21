const express = require('express');
const router = express.Router();
const authController = require('../authController');
const authMiddleware = require('../middlewaree/authMiddleware');
const upload = require('../middlewaree/upload');
const User = require('../models/User');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret } = require("../config");

// Registration routes
router.post('/register', authController.registration);

router.get('/register', async (req, res) => {
    try {
        res.render('register');
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// User login routes
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect('/login');
        }
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            req.flash('error', 'Неверный пароль');
            return res.redirect('/login');
        }
        const token = jwt.sign({ id: user._id, roles: user.roles }, secret, { expiresIn: "24h" });
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.get('/login', (req, res) => {
    res.render("login");
});

// Logout route
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// User profile and order routes
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const ordersDb = await Order.find({ client_id: req.user.id }).sort({ createdAt: 1 });
        res.render("user", { user, ordersDb });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.get('/user/edit', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render("user_edit", { user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.put('/user/edit', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        const currentUser = await User.findById(req.user.id, { username: 1 });
        if (!currentUser) {
            return res.status(400).json({ error: "Пользователь не найден" });
        }
        if (username === currentUser.username) {
            return res.status(400).json({ error: "Новый логин совпадает с текущим" });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Пользователь с таким логином уже существует" });
        }
        const result = await User.updateOne(
            { _id: req.user.id },
            { $set: { username: username } }
        );
        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: "Ошибка обновления, пользователь не был найден" });
        }
        res.json({ message: "Логин успешно изменен", redirect: "/user" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

router.post('/user/edit/avatar', authMiddleware, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'Файл не загружен');
            return res.redirect('/user/edit');
        }
        await User.findByIdAndUpdate(req.user.id, { avatar: "/uploads/" + req.file.filename });
        res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.get('/user/order', authMiddleware, async (req, res) => {
    try {
        const hamburgerDb = await Dish.findOne({ dish_name: "hamburger" });
        const cheeseburgerDb = await Dish.findOne({ dish_name: "cheeseburger" });
        const pizzaDb = await Dish.findOne({ dish_name: "pizza" });
        const friesDb = await Dish.findOne({ dish_name: "fries" });
        const nuggetsDb = await Dish.findOne({ dish_name: "nuggets" });
        res.render("user_order", { hamburgerDb, cheeseburgerDb, pizzaDb, friesDb, nuggetsDb });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.post('/user/order', authMiddleware, async (req, res) => {
    try {
        const hamburgerDb = await Dish.findOne({ dish_name: "hamburger" });
        const cheeseburgerDb = await Dish.findOne({ dish_name: "cheeseburger" });
        const pizzaDb = await Dish.findOne({ dish_name: "pizza" });
        const friesDb = await Dish.findOne({ dish_name: "fries" });
        const nuggetsDb = await Dish.findOne({ dish_name: "nuggets" });
        const totalPrice = Number(req.body.hamburger) * hamburgerDb.price +
            Number(req.body.cheeseburger) * cheeseburgerDb.price +
            Number(req.body.pizza) * pizzaDb.price +
            Number(req.body.fries) * friesDb.price +
            Number(req.body.nuggets) * nuggetsDb.price;
        const arrOrder = [];
        if (Number(req.body.hamburger) > 0) {
            arrOrder.push({ dish_id: hamburgerDb._id, dish_name: hamburgerDb.dish_name, quantity: Number(req.body.hamburger), price_per_item: hamburgerDb.price, total: Number(req.body.hamburger) * hamburgerDb.price });
        }
        if (Number(req.body.cheeseburger) > 0) {
            arrOrder.push({ dish_id: cheeseburgerDb._id, dish_name: cheeseburgerDb.dish_name, quantity: Number(req.body.cheeseburger), price_per_item: cheeseburgerDb.price, total: Number(req.body.cheeseburger) * cheeseburgerDb.price });
        }
        if (Number(req.body.fries) > 0) {
            arrOrder.push({ dish_id: friesDb._id, dish_name: friesDb.dish_name, quantity: Number(req.body.fries), price_per_item: friesDb.price, total: Number(req.body.fries) * friesDb.price });
        }
        if (Number(req.body.pizza) > 0) {
            arrOrder.push({ dish_id: pizzaDb._id, dish_name: pizzaDb.dish_name, quantity: Number(req.body.pizza), price_per_item: pizzaDb.price, total: Number(req.body.pizza) * pizzaDb.price });
        }
        if (Number(req.body.nuggets) > 0) {
            arrOrder.push({ dish_id: nuggetsDb._id, dish_name: nuggetsDb.dish_name, quantity: Number(req.body.nuggets), price_per_item: nuggetsDb.price, total: Number(req.body.nuggets) * nuggetsDb.price });
        }
        if (arrOrder.length === 0) {
            req.flash('error', 'Заказ не может быть пустым');
            return res.redirect('/user/order');
        }
        const currentUser = await User.findById(req.user.id);
        const newOrder = new Order({
            client_id: currentUser._id,
            order: arrOrder,
            price: totalPrice,
            status: "Processing",
            created_at: new Date(),
            updated_at: new Date()
        });
        await newOrder.save();
        req.flash('success', 'Заказ успешно оформлен');
        return res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// Account deletion routes
router.delete('/user/edit/delete', authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        await User.deleteOne({ _id: currentUser._id });
        res.clearCookie("token");
        res.status(200).send("Аккаунт удален");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

router.get('/user/edit/delete', authMiddleware, async (req, res) => {
    try {
        res.render("user_edit_delete");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

module.exports = router;
