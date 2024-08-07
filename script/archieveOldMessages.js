const { Op } = require('sequelize');
const cron = require('node-cron');
const Message = require('../models/message');
const archievedChats = require('../models/archievedChats');

const archiveOldMessages = async () => {
    const transaction = await sequelize.transaction();
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const oldMessages = await Message.findAll({
            where: {
                createdAt: {
                    [Op.lt]: oneDayAgo,
                },
            },
            transaction,
        });

        const archivedMessages = oldMessages.map((message) => {
            return {
                content: message.content,
                userId: message.userId,
                groupId: message.groupId,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            };
        });

        await archievedChats.bulkCreate(archivedMessages, { transaction });

        await Message.destroy({
            where: {
                createdAt: {
                    [Op.lt]: oneDayAgo,
                },
            },
            transaction,
        });

        await transaction.commit();
        console.log('Old messages archived successfully.');
    } catch (error) {
        await transaction.rollback();
        console.error('Failed to archive old messages:', error);
    }
};

cron.schedule('0 0 * * *', archiveOldMessages);
