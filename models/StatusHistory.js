const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Chaque changement de statut d'une commande est journalise ici,
// ce qui alimente la page de suivi cote client (comme un "tracking").
const StatusHistory = sequelize.define('StatusHistory', {
  status: { type: DataTypes.STRING, allowNull: false },
  comment: { type: DataTypes.TEXT }
});

module.exports = StatusHistory;
