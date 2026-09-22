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
const skipReason = process.env.ALCHEMY_API_KEY ? undefined : 'ALCHEMY_API_KEY not set';
void (0, node_test_1.describe)('/rest/web3/walletExploitAddress', { skip: skipReason }, () => {
    (0, node_test_1.before)(async () => {
        const result = await (0, setup_1.createTestApp)();
        app = result.app;
    }, { timeout: 60000 });
    void (0, node_test_1.it)('POST missing wallet address in request body still leads to success notification', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/web3/walletExploitAddress')
            .send({});
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.message, 'Event Listener Created');
    });
    void (0, node_test_1.it)('POST invalid wallet address in request body still leads to success notification', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/web3/walletExploitAddress')
            .send({ walletAddress: 'lalalalala' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.message, 'Event Listener Created');
    });
    void (0, node_test_1.it)('POST self-referential address in request body leads to success notification', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/web3/walletExploitAddress')
            .send({ walletAddress: '0x413744D59d31AFDC2889aeE602636177805Bd7b0' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.message, 'Event Listener Created');
    });
});
//# sourceMappingURL=web3Wallet.test.js.map