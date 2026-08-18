const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const storagePath = process.env.DB_STORAGE || './data/database.sqlite';
const dir = path.dirname(storagePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

module.exports = sequelize;
