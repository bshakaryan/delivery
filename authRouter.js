const Router = require('express');
const router = new Router();
const controller = require('./authController');
const {check} = require("express-validator");
const authMiddleware = require('./middlewaree/authMiddleware');
const roleMiddleware = require('./middlewaree/roleMiddleware');

router.post('/registration', [
    check('username', "Имя пользователя не может быть пустым").notEmpty(),
    check('password', "Пароль должен быть не менее 8 символов").isLength({min: 4}),
    check('name', "Имя не может быть пустым").notEmpty(),
    check('email', "Email не может быть пустым").notEmpty(),
    check('address', "Адрес не может быть пустым").notEmpty(),
    check('phone', "Телефон не может быть пустым").notEmpty()
],controller.registration);
router.post('/login', controller.login)
router.get('/users', roleMiddleware(["ADMIN"]), controller.getUsers)

module.exports = router