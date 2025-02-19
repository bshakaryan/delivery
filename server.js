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


app.post('/register', authController.registration);

app.get('/register', async (req, res) => {
    try {
        res.render('register');
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect('/login');
            // return res.status(400).send("Пользователь не найден");
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            req.flash('error', 'Неверный пароль');
            return res.redirect('/login');
            // return res.status(400).send("Неверный пароль");
        }

        const token = jwt.sign({ id: user._id, roles: user.roles }, secret, { expiresIn: "24h" });

        res.cookie("token", token, { httpOnly: true }); // Убедись, что cookie передается
        res.redirect("/user"); // Редирект на страницу пользователя
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.post("/user/edit/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
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

app.put("/user/edit", authMiddleware, async (req, res) => {
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

app.post("/user/order", authMiddleware, async (req, res) => {
    try {
        const hamburgerDb = await Dish.findOne({ dish_name: "hamburger" });
        const cheeseburgerDb = await Dish.findOne({ dish_name: "cheeseburger" });
        const pizzaDb = await Dish.findOne({ dish_name: "pizza" });
        const friesDb = await Dish.findOne({ dish_name: "fries" });
        const nuggetsDb = await Dish.findOne({ dish_name: "nuggets" });

        const totalPrice = Number(req.body.hamburger) * hamburgerDb.price
            + Number(req.body.cheeseburger) * cheeseburgerDb.price
            + Number(req.body.pizza) * pizzaDb.price
            + Number(req.body.fries) * friesDb.price
            + Number(req.body.nuggets) * nuggetsDb.price;

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

        if (arrOrder.length == 0) {
            req.flash('error', 'Заказ не может быть пустым');
            return res.redirect('/user/order');
            // return res.status(400).send("Заказ не может быть пустым");
        }

        const currentUser = await User.findById(req.user.id);

        const currentOrder = await Order.find({ client_id: currentUser._id });

        const newOrder = new Order({
            client_id: currentUser._id,
            order: arrOrder,
            price: totalPrice,
            status: "Processing",
            created_at: new Date(),
            updated_at: new Date()
        });

        await newOrder.save();


        // console.log(currentUser._id);
        // console.log(arrOrder);
        // console.log(totalPrice);
        // console.log(hamburgerDb.price, req.body.hamburger);
        // console.log(pizzaDb.price, req.body.pizza);
        // console.log(cheeseburgerDb.price, req.body.cheeseburger);
        // console.log(friesDb.price, req.body.fries);
        // console.log(nuggetsDb.price, req.body.nuggets);
        req.flash('success', 'Заказ успешно оформлен');
        return res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/admin/statistics/top", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const topDishes = await Order.aggregate([
            { 
                $match: { createdAt: { $gte: start, $lte: end } } 
            },
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

app.delete("/user/edit/delete", authMiddleware, async (req, res) => {
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

app.get("/user/edit/delete", authMiddleware, async (req, res) => {
    try {
        res.render("user_edit_delete");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});


app.get("/login", (req, res) => {
    res.render("login");
    // res.sendFile(path.join(__dirname, './public/login.html')); // Путь к login.html
});

app.get("/login_admin", (req, res) => {
    res.render("login_admin");
});

app.post("/login_admin", async (req, res) => {
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
            // return res.status(400).send("Пользователь не найден");
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            req.flash('error', 'Неверный пароль');
            return res.redirect('/');
            // return res.status(400).send("Неверный пароль");
        }

        const token = jwt.sign({ id: user._id, roles: user.roles }, secret, { expiresIn: "24h" });
        res.cookie("token", token, { httpOnly: true }); // Убедись, что cookie передается
        res.redirect("/admin"); // Редирект на страницу пользователя
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/admin", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = 5;
        let skip = (page - 1) * limit;


        const ordersDb = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalOrders = await Order.countDocuments();

        res.render("admin", {
            user,
            ordersDb,
            currentPage:
                page,
            totalPages: Math.ceil(totalOrders / limit),
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.post("/admin", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status });

        // const user = req.user;
        // const ordersDb = await Order.find().sort({createdAt: 1});

        // res.render("admin", {user, ordersDb});
        res.json({ success: true, message: "Статус обновлен" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

app.get("/admin/edit-order/:id", authMiddleware, checkRoleMiddleware(["ADMIN"]), async(req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        
        if (!order) {
            req.flash('error', 'Такого заказа не существует');
            return res.redirect("/admin/statistics");
        }

        res.render("admin_edit-order", {orderId, order});
    } catch(err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

app.put("/admin/edit-order/:id", authMiddleware, checkRoleMiddleware(["ADMIN"]), async(req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        if (!status) {
            req.flash('error', 'Статус не указан');
            return res.redirect("/admin/statistics");
        }
        
        
        let updateData = {status};
        
        if (status === "Done") {
            updateData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        const updateOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            {new: true}
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

app.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const ordersDb = await Order.find({ client_id: req.user.id }).sort({ createdAt: 1 });
        res.render("user", { user, ordersDb });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/user/edit", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render("user_edit", { user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/user/order", authMiddleware, async (req, res) => {
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

app.get("/admin/statistics", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
    try {
        res.render("admin_statistics");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/admin/statistics/:username", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
    try {
        const USERNAME = req.params.username;

        const check = await User.find({ username: USERNAME });
        if (check.length == 0) {
            req.flash('error', 'Пользователь не найден');
            return res.redirect("/admin/statistics");
        }

        // console.log(check[0]._id);

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

        // console.log(result);

        res.render("admin_user_statistics", { result });

    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.put("/admin/edit-order/:id/add-gift", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
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

app.delete("/admin/edit-order/:id", authMiddleware, checkRoleMiddleware(["ADMIN"]), async (req, res) => {
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


app.get('/', (req, res) => {
    res.render("index");
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

const server = createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is up port: ${process.env.PORT}`));