const User = require("../models/user");
const bcrypt = require('bcrypt');

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