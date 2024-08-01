const User = require("../models/user");
const Message = require("../models/message");

exports.getAllMessages = async (req, res, next) => {
    try{
        const messages = await Message.findAll({
            include: {
                model: User,
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(messages);
    }catch(err){
        console.error('Error fetching messages:', err);
        res.status(500).json(err);
    }
};

exports.createMessage = async (req, res, next) => {
    const { content } = req.body;
    const userId = req.user.id;
    
    try{
        const messageContent = await Message.create({ content, userId});
        res.status(201).json(messageContent);
    }catch(err){
        console.error(err);
        res.status(500).json(err);
    }
};
