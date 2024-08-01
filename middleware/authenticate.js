const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = (req, res, next) => {
    try{
        const token = req.header('authorization');
        if(!token){
            return res.status(401).json({ message: 'Authentication failed: no token provided' });
        }

        const decodeToken = jwt.verify(token, 'af348f7ac2c1a36a128f5d9d97f0f6ec8c71d91bce0a2c76a124c38a22b6a1376d71e6f8d9a6b7e3ac1d7b3d8c4e8e7a61a7d3e8c1b2d5f3e2b7a6d3c7a4e7f');
        console.log(decodeToken.userId);

        User.findByPk(decodeToken.userId)
            .then(user => {
                if(!user){
                    return res.status(401).json({ message: 'Authentication failed: user not found' });
                }
                req.user = user;
                next();
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            });
    }catch(err){
        console.error(err);
        return res.status(401).json({ message: 'Authentication failed: invalid token' });
    }
};

module.exports = { authenticate };