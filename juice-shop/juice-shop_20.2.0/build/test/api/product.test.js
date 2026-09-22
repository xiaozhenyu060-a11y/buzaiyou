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
const datacache_1 = require("../../data/datacache");
const security = __importStar(require("../../lib/insecurity"));
const utils = __importStar(require("../../lib/utils"));
const tamperingProductId = config_1.default.get('products').findIndex((product) => !!product.urlForProductTamperingChallenge) + 1;
let app;
const authHeader = { Authorization: 'Bearer ' + security.authorize(), 'content-type': 'application/json' };
const jsonHeader = { 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Products', () => {
    void (0, node_test_1.it)('GET all products', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Products');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(Array.isArray(res.body.data));
        for (const product of res.body.data) {
            strict_1.default.equal(typeof product.id, 'number');
            strict_1.default.equal(typeof product.name, 'string');
            strict_1.default.equal(typeof product.description, 'string');
            strict_1.default.equal(typeof product.price, 'number');
            strict_1.default.equal(typeof product.deluxePrice, 'number');
            strict_1.default.equal(typeof product.image, 'string');
        }
    });
    void (0, node_test_1.it)('POST new product is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Products')
            .send({
            name: 'Dirt Juice (1000ml)',
            description: 'Made from ugly dirt.',
            price: 0.99,
            image: 'dirt_juice.jpg'
        });
        strict_1.default.equal(res.status, 401);
    });
    if (utils.isChallengeEnabled(datacache_1.challenges.restfulXssChallenge)) {
        void (0, node_test_1.it)('POST new product does not filter XSS attacks', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/Products')
                .set(authHeader)
                .send({
                name: 'XSS Juice (42ml)',
                description: '<iframe src="javascript:alert(`xss`)">',
                price: 9999.99,
                image: 'xss3juice.jpg'
            });
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.description, '<iframe src="javascript:alert(`xss`)">');
        });
    }
});
void (0, node_test_1.describe)('/api/Products/:id', () => {
    void (0, node_test_1.it)('GET existing product by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Products/1');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.name, 'string');
        strict_1.default.equal(typeof res.body.data.description, 'string');
        strict_1.default.equal(typeof res.body.data.price, 'number');
        strict_1.default.equal(typeof res.body.data.deluxePrice, 'number');
        strict_1.default.equal(typeof res.body.data.image, 'string');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.id, 1);
    });
    void (0, node_test_1.it)('GET non-existing product by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Products/4711');
        strict_1.default.equal(res.status, 404);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.message, 'Not Found');
    });
    void (0, node_test_1.it)('PUT update existing product is possible due to Missing Function-Level Access Control vulnerability', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Products/' + tamperingProductId)
            .set(jsonHeader)
            .send({
            description: '<a href="http://kimminich.de" target="_blank">More...</a>'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.description, '<a href="http://kimminich.de" target="_blank">More...</a>');
    });
    void (0, node_test_1.it)('DELETE existing product is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Products/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing product is forbidden via API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Products/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=product.test.js.map