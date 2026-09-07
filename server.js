require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
app.listen(PORT, () => {
console.log(`Serveur demarre sur http://localhost:${PORT}`);
});
}).catch(err => {
console.error('Impossible de se connecter a la base de donnees :', err);
process.exit(1);
});
