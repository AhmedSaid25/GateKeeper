const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: './gatekeeper.sqlite' });

const Client = sequelize.define('Client', {
  clientName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  apiKey: { type: DataTypes.STRING, unique: true, allowNull: false }
});

module.exports = { Client, sequelize };