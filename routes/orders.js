const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { Order, Payment, StatusHistory, Product } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'proofs')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.png', '.jpg', '.jpeg', '.pdf', '.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Format de fichier non autorise'), ok);
  }
});

function generateReference() {
  return 'CMD-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

// Formulaire de nouvelle demande d'achat
router.get('/commander', requireAuth, async (req, res) => {
  let prefill = null;
  if (req.query.productId) {
    prefill = await Product.findByPk(req.query.productId);
  }
  res.render('order-new', { title: 'Nouvelle demande d\'achat', prefill });
});

router.post('/commander', requireAuth, async (req, res) => {
  const {
    sourceSite, productUrl, productTitle, variantDetails, quantity, notes,
    destinationIsland, destinationCity, destinationAddress, receiverPhone
  } = req.body;

  if (!productUrl || !sourceSite) {
    req.flash('error', 'Le lien du produit et le site source sont obligatoires.');
    return res.redirect('/commander');
  }

  try {
    const order = await Order.create({
      userId: req.session.user.id,
      reference: generateReference(),
      sourceSite,
      productUrl,
      productTitle,
      variantDetails,
      quantity: parseInt(quantity, 10) || 1,
      notes,
      destinationIsland,
      destinationCity,
      destinationAddress,
      receiverPhone,
      status: 'nouvelle_demande'
    });
    await StatusHistory.create({
      orderId: order.id,
      status: 'nouvelle_demande',
      comment: 'Demande recue. Un devis (produit + transport + service) vous sera envoye sous 24-48h.'
    });
    req.flash('success', 'Votre demande a bien ete envoyee ! Reference : ' + order.reference);
    res.redirect('/commandes/' + order.id);
  } catch (err) {
    console.error(err);
    req.flash('error', "Erreur lors de la creation de la demande.");
    res.redirect('/commander');
  }
});

// Liste des commandes du client connecte
router.get('/mon-compte/commandes', requireAuth, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.session.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.render('order-list', { title: 'Mes commandes', orders });
});

// Detail + suivi + paiement d'une commande
router.get('/commandes/:id', requireAuth, async (req, res) => {
  const order = await Order.findOne({
    where: { id: req.params.id, userId: req.session.user.id },
    include: [
      { model: Payment },
      { model: StatusHistory, order: [['createdAt', 'ASC']] }
    ]
  });
  if (!order) {
    req.flash('error', 'Commande introuvable.');
    return res.redirect('/mon-compte/commandes');
  }
  res.render('order-detail', {
    title: 'Commande ' + order.reference,
    order,
    paymentMethods: Payment.PAYMENT_METHODS
  });
});

// Soumission d'un paiement (reference + preuve) par le client
router.post('/commandes/:id/paiement', requireAuth, upload.single('proof'), async (req, res) => {
  const order = await Order.findOne({ where: { id: req.params.id, userId: req.session.user.id } });
  if (!order) {
    req.flash('error', 'Commande introuvable.');
    return res.redirect('/mon-compte/commandes');
  }
  const { method, referenceCode } = req.body;
  try {
    await Payment.create({
      orderId: order.id,
      method,
      amountKmf: order.totalKmf,
      referenceCode,
      proofFilePath: req.file ? '/uploads/proofs/' + req.file.filename : null,
      status: 'en_attente'
    });
    if (order.status === 'devis_envoye') {
      order.status = 'paiement_en_attente';
      await order.save();
      await StatusHistory.create({
        orderId: order.id,
        status: 'paiement_en_attente',
        comment: 'Preuve de paiement recue, en attente de verification par notre equipe.'
      });
    }
    req.flash('success', 'Preuve de paiement envoyee. Nous la verifions sous peu.');
  } catch (err) {
    console.error(err);
    req.flash('error', "Erreur lors de l'envoi du paiement.");
  }
  res.redirect('/commandes/' + order.id);
});

module.exports = router;
