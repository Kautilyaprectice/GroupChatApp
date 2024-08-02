const User = require("../models/user");
const Message = require("../models/message");
const Sequelize = require('sequelize');

exports.getAllMessages = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;  
        const lastMessageId = req.query.lastMessageId;
        const queryOptions = {
            where: { groupId: groupId }, 
            include: {
                model: User,
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'ASC']]
        };

        if (lastMessageId) {
            queryOptions.where.id = { [Sequelize.Op.gt]: lastMessageId };
        }

        const messages = await Message.findAll(queryOptions);
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createMessage = async (req, res, next) => {
    const { content } = req.body;
    const userId = req.user.id;
    const groupId = req.params.groupId; 

    try {
        const messageContent = await Message.create({ content, userId, groupId });
        const messageWithUser = await Message.findOne({
            where: { id: messageContent.id },
            include: {
                model: User,
                attributes: ['id', 'name']
            }
        });
        res.status(201).json(messageWithUser);
    } catch (err) {
        console.error('Error creating message:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

