const Group = require("../models/group");
const GroupMember = require("../models/groupMember");
const Message = require("../models/message");
const User = require("../models/user");

exports.createGroup = async (req, res, next) => {
    try{
        const name = req.body;
        const userId = req.user.id;

        const group = await Group.create(name);
        await GroupMember.create({ groupId: group.id, userId, role: 'admin' });

        res.status(201).json({ message: 'Group created', group });
    }catch(err){
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.inviteToGroup = async (req, res, next) => {
    try {
        const { groupId, userId } = req.body;

        const groupMember = await GroupMember.create({ groupId, userId, role: 'member' });

        res.status(201).json({ message: 'User invited to group', groupMember });
    } catch (err) {
        console.error('Error inviting user to group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getUserGroups = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const groups = await Group.findAll({
            include: {
                model: User,
                where: { id: userId },
                through: {
                    attributes: ['role']
                }
            }
        });

        res.status(200).json(groups);
    } catch (err) {
        console.error('Error fetching user groups:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getMessagesForGroup = async (req, res, next) => {
    const groupId = req.params.groupId;
    const lastMessageId = req.query.lastMessageId;

    try {
        const queryOptions = {
            where: { groupId: groupId },
            include: {
                model: User,
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'ASC']]
        };

        if (lastMessageId) {
            queryOptions.where.id = { [Op.gt]: lastMessageId };
        }

        const messages = await Message.findAll(queryOptions);
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json(err);
    }
};