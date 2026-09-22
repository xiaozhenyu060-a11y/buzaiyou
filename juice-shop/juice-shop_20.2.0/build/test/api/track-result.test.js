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
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/track-order/:id', () => {
    void (0, node_test_1.it)('GET tracking results for the order id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/track-order/5267-f9cd5882f54c75a3');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET all orders by injecting into orderId', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/track-order/%27%20%7C%7C%20true%20%7C%7C%20%27');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(Array.isArray(res.body.data));
        for (const item of res.body.data) {
            strict_1.default.equal(typeof item.orderId, 'string');
            strict_1.default.equal(typeof item.email, 'string');
            strict_1.default.equal(typeof item.totalPrice, 'number');
            strict_1.default.ok(Array.isArray(item.products));
            for (const product of item.products) {
                strict_1.default.equal(typeof product.quantity, 'number');
                strict_1.default.equal(typeof product.name, 'string');
                strict_1.default.equal(typeof product.price, 'number');
                strict_1.default.equal(typeof product.total, 'number');
            }
            strict_1.default.equal(typeof item.eta, 'string');
            strict_1.default.equal(typeof item._id, 'string');
        }
    });
});
//# sourceMappingURL=track-result.test.js.map