function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Veuillez vous connecter pour continuer.');
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', "Acces reserve a l'administrateur.");
    return res.redirect('/');
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
