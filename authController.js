const User = require('./models/User');
const Role = require('./models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator'); 
const {secret} = require("./config");

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: "24h"});
}

class authContoller {
    async registration(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при регистрации", errors});
            }
            const {username, password, name, email, address, phone} = req.body;
            const candidate = await User.findOne({username});
            if (candidate) {
                return res.status(400).json({message: "Пользователь с таким именем уже существует"})
            }
            const hashPassword = bcrypt.hashSync(password, 7);
            const userRole = await Role.findOne({value: "ADMIN"});
            const user = new User({username, password: hashPassword, roles: [userRole.value], name, email, address, phone});
            await user.save();
            return res.json({message: "Пользователь успешно зарегистрирован"});
        } catch (err) {
            console.log(err);
            res.status(400).json({message: 'Registration Error'});
        }
    }

    async login(req, res) {
        try {
            const {username, password} = req.body;
            const user = await User.findOne({username});
            if (!user) {
                return res.status(400).json({message: `Пользователь ${username} не найден`});
            }
            const validPassword = bcrypt.compareSync(password, user.password);
            if (!validPassword) {
                return res.status(400).json({message: `Введен неврный пароль`});
            }
            const token = generateAccessToken(user._id, user.roles);
            return res.json({token});
        } catch (err) {
            console.log(err);
            res.status(400).json({message: 'Login Error'});    
        }
    }

    async getUsers(req, res) {
        try {
            const users = await User.find();
            res.json(users);
        } catch (err) {
            
        }
    }
}

module.exports = new authContoller();