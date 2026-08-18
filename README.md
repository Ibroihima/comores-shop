# KM-Achat — Achat groupe Amazon / Alibaba / Shein pour les Comores

Plateforme web permettant a vos clients comoriens de vous soumettre un lien
produit (Amazon, Alibaba, Shein...), de recevoir un devis, de payer avec un
moyen de paiement comorien, puis de suivre leur commande jusqu'a la livraison
(reception en France -> expedition -> livraison aux Comores).

## ⚠️ Point important a comprendre avant de lancer le projet

Amazon, Alibaba et Shein **n'autorisent pas** qu'un site tiers revende leurs
produits ou "aspire" (scrape) automatiquement leur catalogue et leurs prix :
cela viole leurs conditions d'utilisation et peut faire fermer votre compte
ou entrainer des poursuites. Ce projet ne fait donc **pas** d'integration
technique directe avec ces sites. Le modele economique implemente est celui,
tout a fait legal et tres repandu, de **l'agent d'achat / transitaire** :

1. Le client colle le lien du produit qui l'interesse sur votre site.
2. Vous (l'administrateur) allez vous-meme sur Amazon/Alibaba/Shein, verifiez
   le prix et la disponibilite, et renvoyez un devis (produit + transport +
   frais de service) au client depuis l'admin.
3. Le client paie en KMF via un moyen de paiement comorien.
4. Vous achetez reellement le produit sur le site source avec votre propre
   moyen de paiement, le faites livrer a votre adresse en France, puis
   l'expediez vers les Comores.
5. Le client suit sa commande etape par etape.

C'est exactement le modele economique que vous avez decrit ("on me livre en
France et c'est moi qui livre aux Comores").

## Fonctionnalites incluses

- Inscription / connexion client (comptes securises, mots de passe hashes)
- Formulaire "nouvelle demande d'achat" (lien produit + variante + quantite + adresse Comores)
- Catalogue vitrine optionnel (produits d'exemple ajoutes par l'admin pour inspirer les clients)
- Espace admin :
  - Tableau de bord avec statistiques
  - Gestion des commandes, envoi de devis (prix produit + transport + frais de service)
  - Verification manuelle des paiements (reference + preuve/photo uploadee)
  - Mise a jour du statut de commande a chaque etape logistique
  - Gestion du catalogue vitrine
- Suivi de commande cote client (timeline : nouvelle demande -> devis -> paiement -> achat -> entrepot France -> expedition -> arrivee Comores -> livraison)
- Paiement : **MVola**, **HOLO**, **Huri Money**, virement bancaire, especes a la livraison
  (verification manuelle car ces operateurs n'exposent pas d'API marchande publique a ce jour ;
  vous pourrez brancher une vraie API des qu'elle sera disponible aupres de l'operateur)

## Stack technique

- Node.js + Express
- EJS (rendu cote serveur, simple et rapide a personnaliser)
- Sequelize + SQLite (base de donnees fichier, zero configuration, ideal pour demarrer — migrable vers PostgreSQL/MySQL plus tard en changeant juste `config/database.js`)
- Multer (upload des preuves de paiement)
- Sessions stockees en base (persistantes apres redemarrage)
- Docker + docker-compose

## Installation locale (sans Docker)

```bash
# 1. Installer les dependances
npm install

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# editez .env : mot de passe admin, secret de session, etc.

# 3. Creer le compte admin + produits de demonstration
npm run seed

# 4. Lancer le serveur
npm start
# -> http://localhost:3000
```

Connectez-vous avec l'email/mot de passe definis dans `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`) pour acceder a `/admin`.

## Lancer avec Docker

```bash
cp .env.example .env
# editez .env

docker compose up --build -d
```

Le site sera accessible sur `http://localhost:3000`. Les donnees (base SQLite
et preuves de paiement) sont conservees dans des volumes Docker nommes
(`db_data`, `uploads_data`), donc persistantes meme si vous recreez le
conteneur.

Pour voir les logs : `docker compose logs -f`
Pour arreter : `docker compose down`

## Structure du projet

```
comores-shop/
├── server.js              # point d'entree
├── config/
│   ├── database.js        # connexion Sequelize/SQLite
│   └── seed.js             # creation admin + donnees demo
├── models/                # User, Product, Order, Payment, StatusHistory
├── routes/                # auth, products, orders, admin
├── middleware/auth.js      # protection des routes
├── views/                  # pages EJS (client + admin)
├── public/css/style.css    # design
├── public/uploads/proofs/  # preuves de paiement uploadees
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Prochaines etapes suggerees

- **Notifications** : envoyer un SMS/WhatsApp au client a chaque changement de
  statut (ex. via une API comme Twilio ou un service local comorien).
- **Taux de change** : le taux EUR -> KMF utilise pour calculer le devis est
  actuellement fixe dans `routes/admin.js` (`EUR_TO_KMF`) — vous pouvez le
  rendre dynamique via une API de taux de change.
- **Paiement automatise** : si MVola, HOLO ou Huri Money ouvrent une API
  marchande, vous pourrez remplacer la verification manuelle par un webhook
  automatique dans `routes/admin.js` / `routes/orders.js`.
- **Multi-admin / roles** : ajouter des sous-comptes pour votre equipe logistique.
- **Passage a PostgreSQL** si le volume de commandes grandit fortement.

## Securite

- Changez `SESSION_SECRET` et `ADMIN_PASSWORD` avant toute mise en production.
- Servez le site en HTTPS (via un reverse proxy comme Nginx/Caddy ou un
  service comme Render/Railway) — ne l'exposez jamais en HTTP simple avec de
  vrais paiements.
- Sauvegardez regulierement le volume `db_data`.
