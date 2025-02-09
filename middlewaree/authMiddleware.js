const jwt = require('jsonwebtoken');
// const flash = require('connect-flash');
const { secret } = require('../config');

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        const token = req.cookies.token;

        if (!token) {
            req.flash('error', 'Пользователь не авторизован');
            return res.redirect('/');
            // return res.status(400).json({ message: "Пользователь не авторизован" });
        }

        const decodedData = jwt.verify(token, secret);
        req.user = decodedData;
    
        next();
    } catch (err) {
        console.log(err);
        req.flash('error', 'Пользователь не авторизован');
        return res.redirect('/');
        // return res.status(400).json({ message: "Пользователь не авторизован" });
    }
};
