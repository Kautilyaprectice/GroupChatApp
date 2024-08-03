const { Op } = require('sequelize');
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const Message = require('../models/message');
const User = require('../models/user');

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const group = await Group.create({ name });
        await GroupMember.create({ groupId: group.id, userId, role: 'admin' });

        res.status(201).json({ message: 'Group created', group });
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.inviteToGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const currentUserId = req.user.id;

        if (!groupId || !userId) {
            return res.status(400).json({ error: 'Group ID and User ID are required' });
        }

        const currentUserRole = await GroupMember.findOne({ where: { groupId, userId: currentUserId } });
        if (!currentUserRole || currentUserRole.role !== 'admin') {
            return res.status(403).json({ error: 'User does not have permission to invite members' });
        }

        const existingMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member of this group' });
        }
        const groupMember = await GroupMember.create({ groupId, userId, role: 'member' });
        res.status(201).json({ message: 'User invited to group', groupMember });
    } catch (err) {
        console.error('Error inviting user to group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};



exports.promoteToAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const currentUserId = req.user.id;

        if (!groupId || !userId) {
            return res.status(400).json({ error: 'Group ID and User ID are required' });
        }

        const currentUserRole = await GroupMember.findOne({ where: { groupId, userId: currentUserId } });
        if (!currentUserRole || currentUserRole.role !== 'admin') {
            return res.status(403).json({ error: 'User does not have permission to promote members' });
        }

        const [updated] = await GroupMember.update({ role: 'admin' }, { where: { groupId, userId } });
        if (updated === 0) {
            return res.status(404).json({ error: 'User or Group not found' });
        }

        res.status(200).json({ message: 'User promoted to admin' });
    } catch (err) {
        console.error('Error promoting user to admin:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.removeUserFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const currentUserId = req.user.id;

        if (!groupId || !userId) {
            return res.status(400).json({ error: 'Group ID and User ID are required' });
        }

        const currentUserRole = await GroupMember.findOne({ where: { groupId, userId: currentUserId } });
        if (!currentUserRole || currentUserRole.role !== 'admin') {
            return res.status(403).json({ error: 'User does not have permission to remove members' });
        }

        const existingMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!existingMember) {
            return res.status(404).json({ error: 'User is not a member of this group' });
        }

        const deleted = await GroupMember.destroy({ where: { groupId, userId } });
        if (deleted === 0) {
            return res.status(404).json({ error: 'User or Group not found' });
        }

        res.status(200).json({ message: 'User removed from group' });
    } catch (err) {
        console.error('Error removing user from group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserGroups = async (req, res) => {
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

exports.getMessagesForGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id; 
        const lastMessageId = req.query.lastMessageId;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        const groupMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!groupMember) {
            return res.status(403).json({ error: 'User is not a member of this group' });
        }

        const queryOptions = {
            where: { groupId },
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
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserRole = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const groupMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!groupMember) {
            return res.status(403).json({ error: 'User is not a member of this group' });
        }

        res.status(200).json({ role: groupMember.role });
    } catch (err) {
        console.error('Error fetching user role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}