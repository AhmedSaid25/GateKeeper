const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const {
  DB_DIALECT,
  DB_STORAGE,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  BCRYPT_ROUNDS,
} = require("../config/settings");

let sequelize;

if (DB_DIALECT === "postgres") {
  // All from config (which reads .env). "password authentication failed" = Postgres rejected these credentials.
  sequelize = new Sequelize({
    dialect: "postgres",
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,
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
