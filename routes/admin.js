const express = require('express');
const { Order, Payment, StatusHistory, Product, User } = require('../models');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res) => {
  const [totalOrders, pending, toShip, totalUsers] = await Promise.all([
    Order.count(),
    Order.count({ where: { status: 'nouvelle_demande' } }),
    Order.count({ where: { status: ['achete', 'recu_entrepot_france'] } }),
    User.count({ where: { role: 'client' } })
  ]);
  const recentOrders = await Order.findAll({
    include: [User],
    order: [['createdAt', 'DESC']],
    limit: 10
  });
  res.render('admin/dashboard', {
    title: 'Tableau de bord',
    stats: { totalOrders, pending, toShip, totalUsers },
    recentOrders
  });
});

// Liste + filtre des commandes
router.get('/commandes', async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const orders = await Order.findAll({
    where,
    include: [User],
    order: [['createdAt', 'DESC']]
  });
  res.render('admin/orders', { title: 'Commandes', orders, statuses: Order.STATUSES, statusFilter: req.query.status || '' });
});

// Detail d'une commande cote admin : devis + changement de statut + validation paiement
router.get('/commandes/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [User, Payment, { model: StatusHistory, order: [['createdAt', 'ASC']] }]
  });
  if (!order) {
    req.flash('error', 'Commande introuvable.');
    return res.redirect('/admin/commandes');
  }
  res.render('admin/order-detail', { title: 'Commande ' + order.reference, order, statuses: Order.STATUSES });
});

// Envoyer / mettre a jour le devis
router.post('/commandes/:id/devis', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.redirect('/admin/commandes');

  const { productPriceEur, estimatedWeightKg, shippingPriceKmf, serviceFeeKmf, adminComment } = req.body;
  order.productPriceEur = parseFloat(productPriceEur) || 0;
  order.estimatedWeightKg = parseFloat(estimatedWeightKg) || 0;
  order.shippingPriceKmf = parseFloat(shippingPriceKmf) || 0;
  order.serviceFeeKmf = parseFloat(serviceFeeKmf) || 0;

  // Conversion simplifiee EUR -> KMF (taux fixe indicatif, ajustable ici)
  const EUR_TO_KMF = 493; // taux de reference approximatif, a mettre a jour regulierement
  const productPriceKmf = order.productPriceEur * EUR_TO_KMF;
  order.totalKmf = productPriceKmf + order.shippingPriceKmf + order.serviceFeeKmf;
  order.adminComment = adminComment;
  order.status = 'devis_envoye';
  await order.save();

  await StatusHistory.create({
    orderId: order.id,
    status: 'devis_envoye',
    comment: `Devis envoye : produit ~${order.productPriceEur}EUR, transport ${order.shippingPriceKmf} KMF, service ${order.serviceFeeKmf} KMF. Total : ${order.totalKmf} KMF.`
  });

  req.flash('success', 'Devis envoye au client.');
  res.redirect('/admin/commandes/' + order.id);
});

// Changer le statut manuellement (achete, expedie, livre, etc.)
router.post('/commandes/:id/statut', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.redirect('/admin/commandes');
  const { status, comment } = req.body;
  order.status = status;
  await order.save();
  await StatusHistory.create({ orderId: order.id, status, comment });
  req.flash('success', 'Statut mis a jour.');
  res.redirect('/admin/commandes/' + order.id);
});

// Valider / rejeter un paiement soumis par le client
router.post('/paiements/:id/verifier', async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, { include: [Order] });
  if (!payment) return res.redirect('/admin/commandes');
  const { decision, adminNote } = req.body;
  payment.status = decision === 'confirme' ? 'confirme' : 'rejete';
  payment.adminNote = adminNote;
  payment.verifiedAt = new Date();
  await payment.save();

  if (decision === 'confirme') {
    payment.Order.status = 'paiement_confirme';
    await payment.Order.save();
    await StatusHistory.create({
      orderId: payment.Order.id,
      status: 'paiement_confirme',
      comment: 'Paiement verifie et confirme. Achat du produit en cours.'
    });
  } else {
    await StatusHistory.create({
      orderId: payment.Order.id,
      status: 'paiement_en_attente',
      comment: 'Paiement rejete : ' + (adminNote || 'preuve non valide, merci de renvoyer.')
    });
  }

  req.flash('success', 'Paiement mis a jour.');
  res.redirect('/admin/commandes/' + payment.Order.id);
});

// --- Gestion du catalogue vitrine ---
router.get('/catalogue', async (req, res) => {
  const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/catalog', { title: 'Catalogue vitrine', products });
});

router.post('/catalogue', async (req, res) => {
  const { title, imageUrl, sourceUrl, sourceSite, estimatedPriceEur, category } = req.body;
  await Product.create({ title, imageUrl, sourceUrl, sourceSite, estimatedPriceEur: parseFloat(estimatedPriceEur) || null, category });
  req.flash('success', 'Produit ajoute au catalogue.');
  res.redirect('/admin/catalogue');
});

router.post('/catalogue/:id/toggle', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (product) {
    product.active = !product.active;
    await product.save();
  }
  res.redirect('/admin/catalogue');
});

module.exports = router;
