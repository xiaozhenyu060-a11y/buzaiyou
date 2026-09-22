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
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    const { token } = await (0, auth_1.login)(app, {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
    });
    authHeader = {
        Authorization: 'Bearer ' + token,
        'content-type': 'application/json'
    };
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/BasketItems', () => {
    void (0, node_test_1.it)('GET all basket items is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/BasketItems');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST new basket item is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .send({ BasketId: 2, ProductId: 1, quantity: 1 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET all basket items', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/BasketItems').set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST new basket item', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 2, quantity: 1 });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST new basket item with more than available quantity is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 2, quantity: 101 });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('POST new basket item with more than allowed quantity is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 1, quantity: 6 });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'You can order only up to 5 items of this product.');
    });
    void (0, node_test_1.it)('POST new basket item with invalid basket ID is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 42, ProductId: 1, quantity: 1 });
        strict_1.default.equal(res.status, 401);
        strict_1.default.equal(res.text, "{'error' : 'Invalid BasketId'}");
    });
    void (0, node_test_1.it)('POST new basket item with non-existent product ID is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 999, quantity: 1 });
        strict_1.default.equal(res.status, 500); // quantityCheck throws Error which is caught and passed to next(error)
    });
});
void (0, node_test_1.describe)('/api/BasketItems/:id', () => {
    void (0, node_test_1.it)('GET basket item by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/BasketItems/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update basket item is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/1')
            .set({ 'content-type': 'application/json' })
            .send({ quantity: 2 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE basket item is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/BasketItems/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET newly created basket item by id', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 6, quantity: 3 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .get('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT update newly created basket item', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 3, quantity: 3 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ quantity: 20 });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.quantity, 20);
    });
    void (0, node_test_1.it)('PUT update basket ID of basket item is forbidden', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 8, quantity: 8 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ BasketId: 42 });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.message, 'null: `BasketId` cannot be updated due `noUpdate` constraint');
        strict_1.default.deepEqual(res.body.errors, [{ field: 'BasketId', message: '`BasketId` cannot be updated due `noUpdate` constraint' }]);
    });
    void (0, node_test_1.it)('PUT update basket ID of basket item without basket ID', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ ProductId: 8, quantity: 8 });
        strict_1.default.equal(createRes.status, 200);
        strict_1.default.equal(createRes.body.data.BasketId, undefined);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ BasketId: 3 });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.BasketId, 3);
    });
    void (0, node_test_1.it)('PUT update product ID of basket item is forbidden', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 9, quantity: 9 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ ProductId: 42 });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.message, 'null: `ProductId` cannot be updated due `noUpdate` constraint');
        strict_1.default.deepEqual(res.body.errors, [{ field: 'ProductId', message: '`ProductId` cannot be updated due `noUpdate` constraint' }]);
    });
    void (0, node_test_1.it)('PUT update newly created basket item with more than available quantity is forbidden', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 12, quantity: 12 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ quantity: 100 });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('PUT update basket item with more than allowed quantity is forbidden', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 1, quantity: 1 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader)
            .send({ quantity: 6 });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'You can order only up to 5 items of this product.');
    });
    void (0, node_test_1.it)('DELETE newly created basket item', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 10, quantity: 10 });
        strict_1.default.equal(createRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .delete('/api/BasketItems/' + createRes.body.data.id)
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT update non-existent basket item', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/BasketItems/999')
            .set(authHeader)
            .send({ quantity: 1 });
        strict_1.default.equal(res.status, 500);
    });
});
//# sourceMappingURL=basket-item.test.js.map