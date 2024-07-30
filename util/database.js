const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('group_chat', 'root', 'Kautilya@1', {
    host: 'localhost',
    dialect: 'mysql'

});

module.exports = sequelize;