const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const GroupMember = sequelize.define('groupmember', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isIn: [['admin', 'member']]
        }
    }
});

module.exports = GroupMember;