const jwt = require('jsonwebtoken')
const {secret} = require('../config')


module.exports = function (roles) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            next()
        }

        try {
            if (!req.headers.authorization) {
                req.flash('error', '1 Пользователь не авторизован');
                return res.redirect('/');
            }

            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                req.flash('error', '2 Пользователь не авторизован');
                return res.redirect()
                // return res.status(403).json({message: "TOKEN: Пользователь не авторизован"})
            }
        
            const {roles: userRoles} = jwt.verify(token, secret);
            let hasRole = false
            userRoles.forEach(role => {
                if (roles.includes(role)) {
                    hasRole = true
                }
            })
            if (!hasRole) {
                req.flash('error', 'У вас нет доступа');
                return res.redirect('/user');
                // return res.status(403).json({message: "У вас нет доступа"})
            }
            next();
        } catch (e) {
            console.log(e.name);
            req.flash('error', 'CATCH Пользователь не авторизован');
            return res.redirect('/');
            // return res.status(403).json({message: "OTHER: Пользователь не авторизован"})
        }
    }
};