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
void (0, node_test_1.describe)('/rest/order-history', () => {
    void (0, node_test_1.it)('GET own previous orders', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/order-history')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data[0].totalPrice, 8.96);
        strict_1.default.equal(res.body.data[0].delivered, false);
        strict_1.default.equal(res.body.data[0].products[0].quantity, 3);
        strict_1.default.equal(res.body.data[0].products[0].name, 'Apple Juice (1000ml)');
        strict_1.default.equal(res.body.data[0].products[0].price, 1.99);
        strict_1.default.equal(res.body.data[0].products[0].total, 5.97);
        strict_1.default.equal(res.body.data[0].products[1].quantity, 1);
        strict_1.default.equal(res.body.data[0].products[1].name, 'Orange Juice (1000ml)');
        strict_1.default.equal(res.body.data[0].products[1].price, 2.99);
        strict_1.default.equal(res.body.data[0].products[1].total, 2.99);
        strict_1.default.equal(res.body.data[1].totalPrice, 26.97);
        strict_1.default.equal(res.body.data[1].delivered, true);
        strict_1.default.equal(res.body.data[1].products[0].quantity, 3);
        strict_1.default.equal(res.body.data[1].products[0].name, 'Eggfruit Juice (500ml)');
        strict_1.default.equal(res.body.data[1].products[0].price, 8.99);
        strict_1.default.equal(res.body.data[1].products[0].total, 26.97);
    });
});
void (0, node_test_1.describe)('/rest/order-history/orders', () => {
    void (0, node_test_1.it)('GET all orders is forbidden for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/order-history/orders')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET all orders is forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/order-history/orders')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET all orders for accountant', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'accountant@' + config_1.default.get('application.domain'),
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/order-history/orders')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
});
void (0, node_test_1.describe)('/rest/order-history/:id/delivery-status', () => {
    void (0, node_test_1.it)('PUT delivery status is forbidden for admin', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/rest/order-history/1/delivery-status')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' })
            .send({ delivered: false });
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('PUT delivery status is forbidden for customer', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/rest/order-history/1/delivery-status')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' })
            .send({ delivered: false });
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('PUT delivery status is allowed for accountant', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'accountant@' + config_1.default.get('application.domain'),
            password: 'i am an awesome accountant'
        });
        const res = await (0, supertest_1.default)(app)
            .put('/rest/order-history/1/delivery-status')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' })
            .send({ delivered: false });
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=order-history.test.js.map