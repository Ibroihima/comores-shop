const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Cycle de vie d'une commande
const STATUSES = [
  'nouvelle_demande',      // client vient de soumettre le lien produit
  'devis_envoye',          // admin a chiffre le prix total
  'paiement_en_attente',   // client doit payer / preuve pas encore verifiee
  'paiement_confirme',     // admin a valide le paiement
  'achete',                // admin a achete le produit sur le site source
  'recu_entrepot_france',  // colis recu a l'adresse en France
  'expedie_vers_comores',  // parti vers les Comores
  'arrive_comores',        // arrive aux Comores
  'livre',                 // livre au client
  'annule'
];

const Order = sequelize.define('Order', {
  reference: { type: DataTypes.STRING, unique: true },
  sourceSite: { type: DataTypes.ENUM('amazon', 'alibaba', 'shein', 'autre'), allowNull: false },
  productUrl: { type: DataTypes.TEXT, allowNull: false },
  productTitle: { type: DataTypes.STRING },
  variantDetails: { type: DataTypes.STRING }, // couleur / taille / options
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  notes: { type: DataTypes.TEXT }, // demandes particulieres du client

  estimatedWeightKg: { type: DataTypes.FLOAT },
  productPriceEur: { type: DataTypes.FLOAT },       // rempli par l'admin lors du devis
  serviceFeeKmf: { type: DataTypes.FLOAT },
  shippingPriceKmf: { type: DataTypes.FLOAT },
  totalKmf: { type: DataTypes.FLOAT },

  destinationIsland: { type: DataTypes.STRING },
  destinationCity: { type: DataTypes.STRING },
  destinationAddress: { type: DataTypes.TEXT },
  receiverPhone: { type: DataTypes.STRING },

  status: { type: DataTypes.ENUM(...STATUSES), defaultValue: 'nouvelle_demande' },
  adminComment: { type: DataTypes.TEXT }
});

Order.STATUSES = STATUSES;

module.exports = Order;
