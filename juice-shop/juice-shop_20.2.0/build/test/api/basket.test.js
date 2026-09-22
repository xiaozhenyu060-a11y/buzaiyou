"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const quantity_1 = require("../../models/quantity");
const wallet_1 = require("../../models/wallet");
const db = __importStar(require("../../data/mongodb"));
const security = __importStar(require("../../lib/insecurity"));
let app;
let authHeader;
const validCoupon = security.generateCoupon(15);
const outdatedCoupon = security.generateCoupon(20, new Date(2001, 0, 1));
const forgedCoupon = security.generateCoupon(99);
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
void (0, node_test_1.describe)('/rest/basket/:id', () => {
    void (0, node_test_1.it)('GET existing basket by id is not allowed via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/basket/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET empty basket when requesting non-existing basket id', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/basket/4711').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(res.body.data === null || (typeof res.body.data === 'object' && Object.keys(res.body.data).length === 0));
    });
    void (0, node_test_1.it)('GET existing basket with contained products by id', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/basket/1').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.id, 1);
        strict_1.default.equal(res.body.data.Products.length, 3);
    });
    void (0, node_test_1.it)('GET basket should accept forged JWTs', async () => {
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ data: { email: 'jim@juice-sh.op' }, iat: 1508639612, exp: 9999999999 })).toString('base64url');
        const unsignedToken = `${header}.${payload}.`;
        const res = await (0, supertest_1.default)(app)
            .get('/rest/basket/1')
            .set({ Authorization: 'Bearer ' + unsignedToken, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
    });
});
void (0, node_test_1.describe)('/api/Baskets', () => {
    void (0, node_test_1.it)('POST new basket is not part of API', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Baskets')
            .set(authHeader)
            .send({ UserId: 1 });
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('GET all baskets is not part of API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Baskets').set(authHeader);
        strict_1.default.equal(res.status, 500);
    });
});
void (0, node_test_1.describe)('/api/Baskets/:id', () => {
    void (0, node_test_1.it)('GET existing basket is not part of API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Baskets/1').set(authHeader);
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('PUT update existing basket is not part of API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Baskets/1')
            .set(authHeader)
            .send({ UserId: 2 });
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('DELETE existing basket is not part of API', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Baskets/1').set(authHeader);
        strict_1.default.equal(res.status, 500);
    });
});
void (0, node_test_1.describe)('/rest/basket/:id', () => {
    void (0, node_test_1.it)('GET existing basket of another user', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/basket/2')
            .set({ Authorization: 'Bearer ' + token });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.id, 2);
    });
});
void (0, node_test_1.describe)('/rest/basket/:id/checkout', () => {
    void (0, node_test_1.it)('POST placing an order for a basket is not allowed via public API', async () => {
        const res = await (0, supertest_1.default)(app).post('/rest/basket/1/checkout');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST placing an order for an existing basket returns orderId', async () => {
        const res = await (0, supertest_1.default)(app).post('/rest/basket/1/checkout').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.body.orderConfirmation !== undefined);
    });
    void (0, node_test_1.it)('POST placing an order for a non-existing basket fails', async () => {
        const res = await (0, supertest_1.default)(app).post('/rest/basket/42/checkout').set(authHeader);
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: Basket with id=42 does not exist.'));
    });
    void (0, node_test_1.it)('POST placing an order for a basket with a negative total cost is possible', async () => {
        const itemRes = await (0, supertest_1.default)(app)
            .post('/api/BasketItems')
            .set(authHeader)
            .send({ BasketId: 2, ProductId: 10, quantity: -100 });
        strict_1.default.equal(itemRes.status, 200);
        const res = await (0, supertest_1.default)(app).post('/rest/basket/3/checkout').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.body.orderConfirmation !== undefined);
    });
    void (0, node_test_1.it)('POST placing an order for a basket with 99% discount is possible', async () => {
        const couponRes = await (0, supertest_1.default)(app)
            .put('/rest/basket/2/coupon/' + encodeURIComponent(forgedCoupon))
            .set(authHeader);
        strict_1.default.equal(couponRes.status, 200);
        strict_1.default.ok(couponRes.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(couponRes.body.discount, 99);
        const res = await (0, supertest_1.default)(app).post('/rest/basket/2/checkout').set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.body.orderConfirmation !== undefined);
    });
    void (0, node_test_1.describe)('error cases', () => {
        void (0, node_test_1.it)('should return 500 if QuantityModel.findOne fails during checkout', async (t) => {
            const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
            const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
            await (0, supertest_1.default)(app).post('/api/BasketItems').set(authHeader).send({ BasketId: 4, ProductId: 1, quantity: 1 });
            t.mock.method(quantity_1.QuantityModel, 'findOne', () => { throw new Error('Quantity error'); });
            const res = await (0, supertest_1.default)(app).post('/rest/basket/4/checkout').set(authHeader);
            strict_1.default.equal(res.status, 500);
            strict_1.default.match(res.text, /Quantity error/);
        });
        void (0, node_test_1.it)('should return 500 if WalletModel.findOne fails during checkout', async (t) => {
            const { token } = await (0, auth_1.login)(app, { email: 'admin@' + config_1.default.get('application.domain'), password: 'admin123' });
            const adminAuthHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
            await (0, supertest_1.default)(app).post('/api/BasketItems').set(adminAuthHeader).send({ BasketId: 1, ProductId: 1, quantity: 1 });
            t.mock.method(wallet_1.WalletModel, 'findOne', () => { throw new Error('Wallet error'); });
            const res = await (0, supertest_1.default)(app).post('/rest/basket/1/checkout').set(adminAuthHeader).send({ orderDetails: { paymentId: 'wallet' }, UserId: 1 });
            strict_1.default.equal(res.status, 500);
            strict_1.default.match(res.text, /Wallet error/);
        });
        void (0, node_test_1.it)('should return 500 if ordersCollection.insert fails during checkout', async (t) => {
            const { token } = await (0, auth_1.login)(app, { email: 'admin@' + config_1.default.get('application.domain'), password: 'admin123' });
            const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
            await (0, supertest_1.default)(app).post('/api/BasketItems').set(authHeader).send({ BasketId: 1, ProductId: 1, quantity: 1 });
            t.mock.method(db.ordersCollection, 'insert', async () => { throw new Error('Insert error'); });
            const res = await (0, supertest_1.default)(app).post('/rest/basket/1/checkout').set(authHeader);
            strict_1.default.equal(res.status, 500);
            strict_1.default.match(res.text, /Insert error/);
        });
    });
});
void (0, node_test_1.describe)('/rest/basket/:id/coupon/:coupon', () => {
    void (0, node_test_1.it)('PUT apply valid coupon to existing basket', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/basket/1/coupon/' + encodeURIComponent(validCoupon))
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.discount, 15);
    });
    void (0, node_test_1.it)('PUT apply invalid coupon is not accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/basket/1/coupon/xxxxxxxxxx')
            .set(authHeader);
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT apply outdated coupon is not accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/basket/1/coupon/' + encodeURIComponent(outdatedCoupon))
            .set(authHeader);
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT apply valid coupon to non-existing basket throws error', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/basket/4711/coupon/' + encodeURIComponent(validCoupon))
            .set(authHeader);
        strict_1.default.equal(res.status, 500);
    });
});
//# sourceMappingURL=basket.test.js.map