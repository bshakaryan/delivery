const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewaree/authMiddleware');
const checkRoleMiddleware = require('../middlewaree/checkRoleMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const Dish = require('../models/Dish');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret } = require("../config");
const mongoose = require('mongoose');

// Admin login routes
router.get('/login_admin', (req, res) => {
    res.render("login_admin");
});

router.post('/login_admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (username !== "admin") {
            req.flash('error', 'Вход запрещен');
            return res.redirect('/');
        }
        if (!user) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect('/');
        }
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            req.flash('error', 'Неверный пароль');
            return res.redirect('/');
        }
        const token = jwt.sign({ id: user._id, roles: user.roles }, secret, { expiresIn: "24h" });
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// All routes below require authentication and ADMIN role
router.use(authMiddleware, checkRoleMiddleware(["ADMIN"]));

// Admin dashboard
router.get('/admin', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let page = parseInt(req.query.page) || 1;
        let limit = 5;
        let skip = (page - 1) * limit;
        const ordersDb = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalOrders = await Order.countDocuments();
        res.render("admin", {
            user,
            ordersDb,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// Top dishes statistics
router.get('/admin/statistics/top', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const topDishes = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $unwind: "$order" },
            {
                $group: {
                    _id: "$order.dish_name",
                    totalSold: { $sum: "$order.quantity" },
                    totalRevenue: { $sum: "$order.total" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        const totalRevenue = topDishes.reduce((sum, dish) => sum + dish.totalRevenue, 0);
        res.render('admin_statistics_top', { topDishes, totalRevenue, startDate, endDate });
    } catch (error) {
        console.error(error);
        res.status(500).send("Ошибка сервера");
    }
});

// Update order status
router.post('/admin', async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: "Статус обновлен" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Edit order page
router.get('/admin/edit-order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error', 'Такого заказа не существует');
            return res.redirect("/admin/statistics");
        }
        res.render("admin_edit-order", { orderId, order });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Update order (edit)
router.put('/admin/edit-order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        if (!status) {
            req.flash('error', 'Статус не указан');
            return res.redirect("/admin/statistics");
        }
        let updateData = { status };
        if (status === "Done") {
            updateData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        const updateOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        );
        if (!updateOrder) {
            req.flash('error', 'Заказ не найден');
            return res.redirect("/admin/statistics");
        }
        res.json({ success: true, message: "Статус обновлён" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Add gift to order
router.put('/admin/edit-order/:id/add-gift', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { gift } = req.body;
        if (!gift.dish_id) {
            gift.dish_id = new mongoose.Types.ObjectId();
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Заказ не найден" });
        }
        order.order.push(gift);
        await order.save();
        res.json({ success: true, message: "Комплемент добавлен!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Delete order
router.delete('/admin/edit-order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            req.flash('error', "Заказ не найден");
            return res.redirect("/admin/statistics");
        }
        res.json({ success: true, redirectUrl: "/admin" });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// Admin statistics page
router.get('/admin/statistics', async (req, res) => {
    try {
        res.render("admin_statistics");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

// User-specific statistics
router.get('/admin/statistics/:username', async (req, res) => {
    try {
        const USERNAME = req.params.username;
        const check = await User.find({ username: USERNAME });
        if (check.length === 0) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect("/admin/statistics");
        }
        const result = await Order.aggregate([
            { $match: { client_id: check[0]._id } },
            { $unwind: "$order" },
            {
                $lookup: {
                    from: "dishes",
                    localField: "order.dish_id",
                    foreignField: "_id",
                    as: "dishDetails"
                }
            },
            { $unwind: "$dishDetails" },
            {
                $group: {
                    _id: "$dishDetails.dish_name",
                    totalQuantity: { $sum: "$order.quantity" },
                    totalRevenue: { $sum: "$order.total" }
                }
            }
        ]);
        res.render("admin_user_statistics", { result });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

module.exports = router;
