const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Catalogue "vitrine" gere par l'admin : quelques produits populaires
// pour donner des idees aux clients. La commande reelle se fait toujours
// via une demande (Order) car on ne peut pas revendre en direct le
// catalogue Amazon / Alibaba / Shein sans leurs API officielles.
const Product = sequelize.define('Product', {
  title: { type: DataTypes.STRING, allowNull: false },
  imageUrl: { type: DataTypes.STRING },
  sourceUrl: { type: DataTypes.STRING, allowNull: false },
  sourceSite: { type: DataTypes.ENUM('amazon', 'alibaba', 'shein', 'autre'), allowNull: false },
  estimatedPriceEur: { type: DataTypes.FLOAT },
  category: { type: DataTypes.STRING },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = Product;
