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
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use("/auth", authRouter);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

app.post('/register', authController.registration);

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).send("Пользователь не найден");
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).send("Неверный пароль");
        }

        const token = jwt.sign({ id: user._id, roles: user.roles }, secret, { expiresIn: "24h" });

        res.cookie("token", token, { httpOnly: true }); // Убедись, что cookie передается
        res.redirect("/user"); // Редирект на страницу пользователя
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.post("/user/edit", authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        const currentUser = await User.findById(req.user.id, { username: 1 });
        // console.log("Текущий пользователь:", currentUser.username);
        if (username === currentUser.username) {
            return res.status(400).send("Новый логин совпадает с текущим");
        }

        const user = await User.findOne({ username });

        if (user) {
            return res.status(400).send("Пользователь с таким логином уже существует");
        }
        // console.log(`Обновляем логин пользователя ${currentUser.username} на ${username}`);
        const result = await User.updateOne(
            { username: currentUser.username },
            { $set: { username: username } }
        );
        // console.log("Результат обновления:", result);
        if (result.nModified === 0) {
            return res.status(400).send("Ошибка обновления, пользователь не был найден");
        }
        res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
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
            arrOrder.push({dish_id: hamburgerDb._id, dish_name: hamburgerDb.dish_name, quantity: Number(req.body.hamburger), price_per_item: hamburgerDb.price, total: Number(req.body.hamburger) * hamburgerDb.price});
        }
        if (Number(req.body.cheeseburger) > 0) {
            arrOrder.push({dish_id: cheeseburgerDb._id, dish_name: cheeseburgerDb.dish_name, quantity: Number(req.body.cheeseburger), price_per_item: cheeseburgerDb.price, total: Number(req.body.cheeseburger) * cheeseburgerDb.price});
        }
        if (Number(req.body.fries) > 0) {
            arrOrder.push({dish_id: friesDb._id, dish_name: friesDb.dish_name, quantity: Number(req.body.fries), price_per_item: friesDb.price, total: Number(req.body.fries) * friesDb.price});
        }
        if (Number(req.body.pizza) > 0) {
            arrOrder.push({dish_id: pizzaDb._id, dish_name: pizzaDb.dish_name, quantity: Number(req.body.pizza), price_per_item: pizzaDb.price, total: Number(req.body.pizza) * pizzaDb.price});
        }
        if (Number(req.body.nuggets) > 0) {
            arrOrder.push({dish_id: nuggetsDb._id, dish_name: nuggetsDb.dish_name, quantity: Number(req.body.nuggets), price_per_item: nuggetsDb.price, total: Number(req.body.nuggets) * nuggetsDb.price});
        }

        if(arrOrder.length == 0) {
            return res.status(400).send("Заказ не может быть пустым");
        }
        
        const currentUser = await User.findById(req.user.id);

        const currentOrder = await Order.find({client_id: currentUser._id});

        const newOrder = new Order({
            client_id: currentUser._id,
            order: arrOrder,
            price: totalPrice,
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

        res.redirect("/user");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, './public/login.html')); // Путь к login.html
});

app.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render("user", { user });
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
        const user = await User.findById(req.user.id);
        res.render("user_order", { user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Ошибка сервера");
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

const server = createServer(app);
server.listen(process.env.PORT, () => console.log(`Server is up port: ${process.env.PORT}`));

/*
{
    _id: 122123,
    client_id: 1,
        order: [
            {
                dish_id: 1,
                quantity: 1
            }
            {
                dish_id: 1,
                quantity: 2
            }
        ]
        price: 12.59
        created_at: new Date()
        updated_at: new Date()
    ]
}

{
    _id: 213,
    dish_name: "pizza",
    description: "nice pizza, cheese",
    price: 12.49
}
*/