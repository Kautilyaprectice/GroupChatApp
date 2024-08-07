const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const archievedChats = sequelize.define('archieve_chat', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    }
});

module.exports = archievedChats;