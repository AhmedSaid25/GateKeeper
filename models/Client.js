const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const { DB_DIALECT, DB_STORAGE, BCRYPT_ROUNDS } = require("../config/settings");

let sequelize;

if (DB_DIALECT === "postgres") {
  sequelize = new Sequelize({
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
} else {
  sequelize = new Sequelize({ dialect: "sqlite", storage: DB_STORAGE });
}

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    apiKey: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    apiKeyHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    hooks: {},
  },
);

module.exports = { Client, sequelize };
