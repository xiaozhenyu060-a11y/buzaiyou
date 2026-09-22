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
const security = __importStar(require("../../lib/insecurity"));
let app;
const authHeader = { Authorization: `Bearer ${security.authorize()}`, 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/products/:id/reviews', () => {
    void (0, node_test_1.it)('GET product reviews by product id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/1/reviews');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        const review = res.body.data[0];
        strict_1.default.equal(typeof review.product, 'number');
        strict_1.default.equal(typeof review.message, 'string');
        strict_1.default.equal(typeof review.author, 'string');
    });
    void (0, node_test_1.it)('GET product reviews attack by injecting a mongoDB sleep command', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/sleep(1)/reviews');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
    });
    // FIXME Turn on when #1960 is resolved
    void node_test_1.it.skip('GET product reviews by alphanumeric non-mongoDB-command product id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/kaboom/reviews');
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('PUT single product review can be created', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/products/1/reviews')
            .send({
            message: 'Lorem Ipsum',
            author: 'Anonymous'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
    });
});
void (0, node_test_1.describe)('/rest/products/reviews', () => {
    let reviewId;
    (0, node_test_1.before)(async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/1/reviews');
        const response = res.body;
        reviewId = response.data[0]._id;
    });
    void (0, node_test_1.it)('PATCH single product review can be edited', async () => {
        const res = await (0, supertest_1.default)(app)
            .patch('/rest/products/reviews')
            .set(authHeader)
            .send({
            id: reviewId,
            message: 'Lorem Ipsum'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.modified, 'number');
        strict_1.default.ok(Array.isArray(res.body.original));
        strict_1.default.ok(Array.isArray(res.body.updated));
    });
    void (0, node_test_1.it)('PATCH single product review editing need an authenticated user', async () => {
        const res = await (0, supertest_1.default)(app)
            .patch('/rest/products/reviews')
            .send({
            id: reviewId,
            message: 'Lorem Ipsum'
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST non-existing product review cannot be liked', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/products/reviews')
            .set({ Authorization: `Bearer ${token}` })
            .send({
            id: 'does not exist'
        });
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('POST single product review can be liked', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/products/reviews')
            .set({ Authorization: `Bearer ${token}` })
            .send({
            id: reviewId
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PATCH multiple product review via injection', async () => {
        const totalReviews = config_1.default.get('products').reduce((sum, { reviews = [] }) => sum + reviews.length, 1);
        const res = await (0, supertest_1.default)(app)
            .patch('/rest/products/reviews')
            .set(authHeader)
            .send({
            id: { $ne: -1 },
            message: 'trololololololololololololololololololololololololololol'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.modified, 'number');
        strict_1.default.ok(Array.isArray(res.body.original));
        strict_1.default.ok(Array.isArray(res.body.updated));
        strict_1.default.equal(res.body.modified, totalReviews);
    });
});
//# sourceMappingURL=product-review.test.js.map