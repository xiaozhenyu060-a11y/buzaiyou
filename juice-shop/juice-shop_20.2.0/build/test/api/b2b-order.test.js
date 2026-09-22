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
const datacache_1 = require("../../data/datacache");
const utils = __importStar(require("../../lib/utils"));
const security = __importStar(require("../../lib/insecurity"));
const setup_1 = require("./helpers/setup");
let app;
const authHeader = { Authorization: 'Bearer ' + security.authorize(), 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/b2b/v2/orders', () => {
    if (utils.isChallengeEnabled(datacache_1.challenges.rceChallenge) || utils.isChallengeEnabled(datacache_1.challenges.rceOccupyChallenge)) {
        void (0, node_test_1.it)('POST endless loop exploit in "orderLinesData" will raise explicit error', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/b2b/v2/orders')
                .set(authHeader)
                .send({
                orderLinesData: '(function dos() { while(true); })()'
            });
            strict_1.default.equal(res.status, 500);
            strict_1.default.ok(res.text.includes('Infinite loop detected - reached max iterations'));
        });
        void (0, node_test_1.it)('POST busy spinning regex attack does not raise an error', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/b2b/v2/orders')
                .set(authHeader)
                .send({
                orderLinesData: '/((a+)+)b/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa")'
            });
            strict_1.default.equal(res.status, 503);
        });
        void (0, node_test_1.it)('POST sandbox breakout attack in "orderLinesData" will raise error', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/b2b/v2/orders')
                .set(authHeader)
                .send({
                orderLinesData: 'this.constructor.constructor("return process")().exit()'
            });
            strict_1.default.equal(res.status, 500);
        });
    }
    void (0, node_test_1.it)('POST new B2B order is forbidden without authorization token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/b2b/v2/orders')
            .send({});
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST new B2B order accepts arbitrary valid JSON', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/b2b/v2/orders')
            .set(authHeader)
            .send({
            foo: 'bar',
            test: 42
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        if (res.body.cid !== undefined)
            strict_1.default.equal(typeof res.body.cid, 'string');
        strict_1.default.equal(typeof res.body.orderNo, 'string');
        strict_1.default.equal(typeof res.body.paymentDue, 'string');
    });
    void (0, node_test_1.it)('POST new B2B order has passed "cid" in response', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/b2b/v2/orders')
            .set(authHeader)
            .send({
            cid: 'test'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.cid, 'test');
    });
});
//# sourceMappingURL=b2b-order.test.js.map