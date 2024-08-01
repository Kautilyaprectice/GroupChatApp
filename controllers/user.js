const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res, next) => {

    const { name, email, phoneNumber, password } = req.body;
    try{
        const existingUser = await User.findOne({ where: {email: email }});
        if(existingUser){
            return res.status(403).json({ error: 'User already exists' });
        }

        bcrypt.hash(password, 10, async (err, hash) => {
            console.log(err);
            await User.create({ name, email, phoneNumber, password: hash });
            res.status(201).json({ message: "Successfully created a new user"});
        });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};

function generateAccessTocken(id){
    return jwt.sign({ userId: id }, 'af348f7ac2c1a36a128f5d9d97f0f6ec8c71d91bce0a2c76a124c38a22b6a1376d71e6f8d9a6b7e3ac1d7b3d8c4e8e7a61a7d3e8c1b2d5f3e2b7a6d3c7a4e7f');
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try{
        const user = await User.findOne({ where: { email }});
        if(!user){
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({ success: false, message: 'incorrect password' });
        }

        res.status(200).json({ message: 'Login successful', token: generateAccessTocken(user.id), userId: user.id });
        
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};