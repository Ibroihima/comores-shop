const request = require('supertest');
const { sequelize } = require('../models');
const app = require('../app');
beforeAll(async () => {
await sequelize.sync({ force: true });
});
afterAll(async () => {
await sequelize.close();
});
describe('Pages publiques', () => {
test('GET / renvoie 200', async () => {
const res = await request(app).get('/');
expect(res.statusCode).toBe(200);
});
test('GET /login renvoie 200', async () => {
const res = await request(app).get('/login');
expect(res.statusCode).toBe(200);
});
test('GET /register renvoie 200', async () => {
const res = await request(app).get('/register');
expect(res.statusCode).toBe(200);
});
test('GET /catalogue renvoie 200', async () => {
const res = await request(app).get('/catalogue');
expect(res.statusCode).toBe(200);
});
test('GET /route-inconnue renvoie 404', async () => {
const res = await request(app).get('/route-inconnue-xyz');
expect(res.statusCode).toBe(404);
});
});
describe('Inscription utilisateur', () => {
test('donnees invalides -> redirection vers /register', async () => {
const res = await request(app)
.post('/register')
.send({ name: '', email: 'pas-un-email', phone: '', password: '123' });
expect(res.statusCode).toBe(302);
expect(res.headers.location).toBe('/register');
});
test('donnees valides -> compte cree et redirection vers /', async () => {
const res = await request(app)
.post('/register')
.send({
name: 'Test User',
email: 'test.user@example.com',
phone: '0612345678',
password: 'motdepasse123'
});
expect(res.statusCode).toBe(302);
expect(res.headers.location).toBe('/');
});
});
