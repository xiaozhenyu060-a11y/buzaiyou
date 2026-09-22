"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const supertest_1 = __importDefault(require("supertest"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
let authHeader;
let cardId;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    const { token } = await (0, auth_1.login)(app, { email: 'jim@juice-sh.op', password: 'ncc-1701' });
    authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Cards', () => {
    void (0, node_test_1.it)('GET all cards is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET all cards', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards').set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST new card is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').send({
            fullName: 'Jim',
            cardNum: 12345678876543210,
            expMonth: 1,
            expYear: new Date().getFullYear()
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST new card with all valid fields', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').set(authHeader).send({
            fullName: 'Jim',
            cardNum: 1234567887654321,
            expMonth: 1,
            expYear: 2085
        });
        strict_1.default.equal(res.status, 201);
    });
    void (0, node_test_1.it)('GET all cards returns masked card numbers', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(JSON.stringify(res.body).includes('"cardNum":"************4321"'));
    });
    void (0, node_test_1.it)('POST new card with invalid card number', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').set(authHeader).send({
            fullName: 'Jim',
            cardNum: 12345678876543210,
            expMonth: 1,
            expYear: new Date().getFullYear()
        });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('POST new card with invalid expMonth', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').set(authHeader).send({
            fullName: 'Jim',
            cardNum: 1234567887654321,
            expMonth: 13,
            expYear: new Date().getFullYear()
        });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('POST new card with invalid expYear', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').set(authHeader).send({
            fullName: 'Jim',
            cardNum: 1234567887654321,
            expMonth: 1,
            expYear: 2015
        });
        strict_1.default.equal(res.status, 400);
    });
});
void (0, node_test_1.describe)('/api/Cards/:id', () => {
    (0, node_test_1.before)(async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Cards').set(authHeader).send({
            fullName: 'Jim',
            cardNum: 1234567887654321,
            expMonth: 1,
            expYear: 2088
        });
        strict_1.default.equal(res.status, 201);
        cardId = res.body.data.id;
    });
    void (0, node_test_1.it)('GET card by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards/' + cardId);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update card is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).put('/api/Cards/' + cardId).send({ quantity: 2 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE card by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Cards/' + cardId);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET card by id', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards/' + cardId).set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET card by id returns masked card number', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Cards/' + cardId).set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(JSON.stringify(res.body).includes('"cardNum":"************4321"'));
    });
    void (0, node_test_1.it)('GET card by non-existing id returns 400 for authorized user', async () => {
        const nonExistingId = 999999;
        const res = await (0, supertest_1.default)(app).get('/api/Cards/' + nonExistingId).set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.status, 'error');
        strict_1.default.equal(res.body.data, 'Malicious activity detected');
    });
    void (0, node_test_1.it)('PUT update card by id is forbidden via authorized API call', async () => {
        const res = await (0, supertest_1.default)(app).put('/api/Cards/' + cardId).set(authHeader).send({ fullName: 'Jimy' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE card by id', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Cards/' + cardId).set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('DELETE card by id again returns 400 for authorized user', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Cards/' + cardId).set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.status, 'error');
        strict_1.default.equal(res.body.data, 'Malicious activity detected.');
    });
});
//# sourceMappingURL=payment.test.js.map