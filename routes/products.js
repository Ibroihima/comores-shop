const express = require('express');
const { Product } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  const where = { active: true };
  if (req.query.site) where.sourceSite = req.query.site;
  const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] });
  res.render('products', { title: 'Catalogue', products, siteFilter: req.query.site || '' });
});

module.exports = router;
