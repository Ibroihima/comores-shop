require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const { sequelize } = require('./models');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Vues ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// --- Middlewares de base ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- Session (stockee en base, persiste apres redemarrage) ---
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-a-changer',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
sessionStore.sync();

app.use(flash());

// Rendre les messages flash + infos utilisateur dispo dans toutes les vues
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});
app.use(attachUser);

// --- Routes ---
app.get('/', (req, res) => res.render('index', { title: 'Accueil' }));
app.use('/', authRoutes);
app.use('/catalogue', productRoutes);
app.use('/', orderRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

// Gestion d'erreurs globale
app.use((err, req, res, next) => {
  console.error(err);
  req.flash && req.flash('error', 'Une erreur est survenue.');
  res.status(500).render('404', { title: 'Erreur' });
});

// --- Demarrage ---
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Impossible de se connecter a la base de donnees :', err);
  process.exit(1);
});
