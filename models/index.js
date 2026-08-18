const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Payment = require('./Payment');
const StatusHistory = require('./StatusHistory');

// --- Associations ---
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(StatusHistory, { foreignKey: 'orderId', onDelete: 'CASCADE' });
StatusHistory.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = { sequelize, User, Product, Order, Payment, StatusHistory };
