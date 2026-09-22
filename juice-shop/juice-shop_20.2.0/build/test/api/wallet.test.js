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
const wallet_1 = require("../../models/wallet");
const auth_1 = require("./helpers/auth");
let app;
let authHeader;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    const { token } = await (0, auth_1.login)(app, { email: 'demo', password: 'demo' });
    authHeader = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Wallets', () => {
    void (0, node_test_1.it)('GET wallet is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/wallet/balance');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET wallet retrieves wallet amount of requesting user', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/wallet/balance')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data, 200);
    });
    void (0, node_test_1.it)('PUT wallet is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/wallet/balance')
            .send({ balance: 10 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT charge wallet from credit card of requesting user', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/wallet/balance')
            .set(authHeader)
            .send({ balance: 10, paymentId: 2 });
        strict_1.default.equal(res.status, 200);
        const balanceRes = await (0, supertest_1.default)(app)
            .get('/rest/wallet/balance')
            .set(authHeader);
        strict_1.default.equal(balanceRes.status, 200);
        strict_1.default.ok(balanceRes.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(balanceRes.body.data, 210);
    });
    void (0, node_test_1.it)('PUT charge wallet from foreign credit card is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/wallet/balance')
            .set(authHeader)
            .send({ balance: 10, paymentId: 1 });
        strict_1.default.equal(res.status, 402);
    });
    void (0, node_test_1.it)('PUT charge wallet without credit card is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/wallet/balance')
            .set(authHeader)
            .send({ balance: 10 });
        strict_1.default.equal(res.status, 402);
    });
    void (0, node_test_1.it)('GET wallet balance for user without a wallet returns 404', async () => {
        const email = `newuser${Date.now()}@juice-sh.op`;
        const userRes = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .send({ email, password: 'password', passwordRepeat: 'password', securityQuestion: { id: 1 }, securityAnswer: 'answer' });
        const userId = userRes.body.data.id;
        const loginRes = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .send({ email, password: 'password' });
        await wallet_1.WalletModel.destroy({ where: { UserId: userId } });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/wallet/balance')
            .set({ Authorization: 'Bearer ' + loginRes.body.authentication.token });
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.status, 'error');
    });
});
//# sourceMappingURL=wallet.test.js.map