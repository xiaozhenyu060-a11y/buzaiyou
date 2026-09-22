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
const config_1 = __importDefault(require("config"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Quantitys', () => {
    void (0, node_test_1.it)('GET quantity of all items for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET quantity of all items for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `admin@${config_1.default.get('application.domain')}`,
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET quantity of all items for accounting users', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST quantity is forbidden for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ ProductId: 1, quantity: 100 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST quantity forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `admin@${config_1.default.get('application.domain')}`,
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ ProductId: 1, quantity: 100 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST quantity is forbidden for accounting users', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/api/Quantitys')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ ProductId: 1, quantity: 100 });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/api/Quantitys/:ids', () => {
    void (0, node_test_1.it)('GET quantity of all items is forbidden for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.body.error, 'Malicious activity detected');
    });
    void (0, node_test_1.it)('GET quantity of all items is forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `admin@${config_1.default.get('application.domain')}`,
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.body.error, 'Malicious activity detected');
    });
    void (0, node_test_1.it)('GET quantity of all items for accounting users blocked by IP filter', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 403);
    });
    void node_test_1.it.skip('GET quantity of all items for accounting users from IP 123.456.789', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT quantity is forbidden for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ quantity: 100 });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.body.error, 'Malicious activity detected');
    });
    void (0, node_test_1.it)('PUT quantity is forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ quantity: 100 });
        strict_1.default.equal(res.status, 403);
        strict_1.default.equal(res.body.error, 'Malicious activity detected');
    });
    void (0, node_test_1.it)('PUT quantity as accounting user blocked by IP filter', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ quantity: 100 });
        strict_1.default.equal(res.status, 403);
    });
    void node_test_1.it.skip('PUT quantity as accounting user from IP 123.456.789', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })
            .send({ quantity: 100 });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.quantity, 100);
    });
    void (0, node_test_1.it)('DELETE quantity is forbidden for accountant', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `accountant@${config_1.default.get('application.domain')}`,
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE quantity is forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `admin@${config_1.default.get('application.domain')}`,
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE quantity is forbidden for users', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Quantitys/1')
            .set({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=quantity.test.js.map