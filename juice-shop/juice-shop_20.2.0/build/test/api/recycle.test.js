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
const setup_1 = require("./helpers/setup");
const security = __importStar(require("../../lib/insecurity"));
let app;
const authHeader = { Authorization: 'Bearer ' + security.authorize(), 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Recycles', () => {
    void (0, node_test_1.it)('POST new recycle', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Recycles')
            .set(authHeader)
            .send({
            quantity: 200,
            AddressId: '1',
            isPickup: true,
            date: '2017-05-31'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
    });
    void (0, node_test_1.it)('Will prevent GET all recycles from this endpoint', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Recycles');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.err, 'Sorry, this endpoint is not supported.');
    });
    void (0, node_test_1.it)('Will GET existing recycle from this endpoint', async () => {
        // First create a recycle so we can GET it
        await (0, supertest_1.default)(app)
            .post('/api/Recycles')
            .set(authHeader)
            .send({
            quantity: 100,
            AddressId: '1',
            isPickup: false,
            date: '2017-06-01'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/api/Recycles/1');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        const items = res.body.data;
        strict_1.default.ok(Array.isArray(items));
        for (const item of items) {
            strict_1.default.equal(typeof item.id, 'number');
            strict_1.default.equal(typeof item.UserId, 'number');
            strict_1.default.equal(typeof item.AddressId, 'number');
            strict_1.default.equal(typeof item.quantity, 'number');
            strict_1.default.equal(typeof item.isPickup, 'boolean');
            strict_1.default.ok(item.date !== undefined);
            strict_1.default.equal(typeof item.createdAt, 'string');
            strict_1.default.equal(typeof item.updatedAt, 'string');
        }
    });
    void (0, node_test_1.it)('PUT update existing recycle is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Recycles/1')
            .set(authHeader)
            .send({
            quantity: 100000
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing recycle is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Recycles/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=recycle.test.js.map