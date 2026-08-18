const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Creer un compte' });
});

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').trim().notEmpty().withMessage('Telephone requis'),
    body('password').isLength({ min: 6 }).withMessage('6 caracteres minimum')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg).join(' / '));
      return res.redirect('/register');
    }
    const { name, email, phone, password, island, city, address } = req.body;
    try {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        req.flash('error', 'Un compte existe deja avec cet email.');
        return res.redirect('/register');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, phone, passwordHash, island, city, address });
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      req.flash('success', 'Bienvenue ' + user.name + ' !');
      res.redirect('/');
    } catch (err) {
      console.error(err);
      req.flash('error', "Erreur lors de la creation du compte.");
      res.redirect('/register');
    }
  }
);

router.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect(user.role === 'admin' ? '/admin' : '/mon-compte/commandes');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur de connexion.');
    res.redirect('/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
