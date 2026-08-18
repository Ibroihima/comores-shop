const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Moyens de paiement comoriens geres manuellement (pas d'API marchande
// publique disponible actuellement pour MVola / HOLO / Huri Money) :
// le client paie via son moyen prefere puis envoie une reference +
// une preuve (photo/capture) que l'admin verifie avant de continuer.
const PAYMENT_METHODS = [
  'mvola',            // MVola (Telma Comores)
  'holo',             // HOLO (BDC)
  'huri_money',       // Huri Money (Comores Telecom)
  'virement_bancaire',// Exim Bank / BDC / AFG Bank / BFC
  'especes_livraison' // paiement cash a la livraison aux Comores
];

const Payment = sequelize.define('Payment', {
  method: { type: DataTypes.ENUM(...PAYMENT_METHODS), allowNull: false },
  amountKmf: { type: DataTypes.FLOAT, allowNull: false },
  referenceCode: { type: DataTypes.STRING },   // reference transaction saisie par le client
  proofFilePath: { type: DataTypes.STRING },   // capture d'ecran / photo du recu
  status: { type: DataTypes.ENUM('en_attente', 'confirme', 'rejete'), defaultValue: 'en_attente' },
  verifiedAt: { type: DataTypes.DATE },
  adminNote: { type: DataTypes.TEXT }
});

Payment.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = Payment;
