require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Product } = require('../models');

async function seed() {
  await sequelize.sync();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'change-moi-1234', 10);
    await User.create({
      name: process.env.ADMIN_NAME || 'Administrateur',
      email: adminEmail,
      phone: '+33000000000',
      passwordHash,
      role: 'admin'
    });
    console.log('Compte admin cree :', adminEmail);
  } else {
    console.log('Compte admin deja existant :', adminEmail);
  }

  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate([
      {
        title: 'Ecouteurs sans fil Bluetooth',
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
        sourceUrl: 'https://www.amazon.fr/s?k=ecouteurs+bluetooth',
        sourceSite: 'amazon',
        estimatedPriceEur: 25,
        category: 'Electronique'
      },
      {
        title: 'Lot de vetements tendance',
        imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500',
        sourceUrl: 'https://www.shein.com',
        sourceSite: 'shein',
        estimatedPriceEur: 15,
        category: 'Mode'
      },
      {
        title: 'Materiel professionnel en gros',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500',
        sourceUrl: 'https://www.alibaba.com',
        sourceSite: 'alibaba',
        estimatedPriceEur: 200,
        category: 'Import professionnel'
      }
    ]);
    console.log('Produits de demonstration crees.');
  }

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
