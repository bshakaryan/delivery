const jwt = require('jsonwebtoken');
const { secret } = require('../config');

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        // Извлечение токена из cookies
        // console.log("Cookies:", req.cookies);
        const token = req.cookies.token;

        if (!token) {
            return res.status(400).json({ message: "Пользователь не авторизован" });
        }
        // console.log("Токен:", token);
        const decodedData = jwt.verify(token, secret);
        req.user = decodedData; // Сохраняем информацию о пользователе
        // console.log("Декодированные данные:", decodedData);

        next(); // Передаем управление следующему middleware
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: "Пользователь не авторизован" });
    }
};
