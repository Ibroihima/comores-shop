const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  island: { type: DataTypes.STRING }, // Ngazidja, Ndzuani, Mwali
  city: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('client', 'admin'), defaultValue: 'client' }
});

module.exports = User;
