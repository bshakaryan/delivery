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
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
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
        const currentUser = await User.findById(req.user.id, {username: 1});

        // Логируем текущего пользователя
        // console.log("Текущий пользователь:", currentUser.username);

        // Проверка, не совпадает ли новый логин с текущим
        if (username === currentUser.username) {
            return res.status(400).send("Новый логин совпадает с текущим");
        }

        // Проверяем, существует ли уже пользователь с новым логином
        const user = await User.findOne({ username });

        if (user) {
            return res.status(400).send("Пользователь с таким логином уже существует");
        }

        // Логируем, что мы собираемся обновить пользователя
        // console.log(`Обновляем логин пользователя ${currentUser.username} на ${username}`);

        // Обновляем логин текущего пользователя
        const result = await User.updateOne(
            { username: currentUser.username },
            { $set: { username: username } }
        );

        // Логируем результат обновления
        // console.log("Результат обновления:", result);

        if (result.nModified === 0) {
            return res.status(400).send("Ошибка обновления, пользователь не был найден");
        }

        // Перенаправляем на страницу профиля
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
        res.render("user_edit", {user});
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
    id: 1231,
    client_id: 1,
    order: [
        {
            dish_name: "Burger",
            quantity: 1
        }
        {
            dish_name: "Fries",
            quantity: 2
        }
    ]
    price: 12.59
    created_at: new Date()
    updated_at: new Date()
}
*/