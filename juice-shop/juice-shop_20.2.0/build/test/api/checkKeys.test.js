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
void (0, node_test_1.describe)('Web3 Key Derivation & NFT Unlock', () => {
    (0, node_test_1.before)(async () => {
        const result = await (0, setup_1.createTestApp)();
        app = result.app;
    }, { timeout: 60000 });
    void (0, node_test_1.describe)('/rest/web3/submitKey', () => {
        void (0, node_test_1.it)('POST missing key in request body gets rejected as non-Ethereum key', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/submitKey')
                .send({});
            strict_1.default.equal(res.status, 401);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Looks like you entered a non-Ethereum private key to access me.');
        });
        void (0, node_test_1.it)('POST arbitrary string in request body gets rejected as non-Ethereum key', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/submitKey')
                .send({ privateKey: 'lalalala' });
            strict_1.default.equal(res.status, 401);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Looks like you entered a non-Ethereum private key to access me.');
        });
        void (0, node_test_1.it)('POST public wallet key in request body gets rejected as such', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/submitKey')
                .send({ privateKey: '0x02c7a2a93289c9fbda5990bac6596993e9bb0a8d3f178175a80b7cfd983983f506' });
            strict_1.default.equal(res.status, 401);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Looks like you entered the public key of my ethereum wallet!');
        });
        void (0, node_test_1.it)('POST wallet address in request body gets rejected as such', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/submitKey')
                .send({ privateKey: '0x8343d2eb2B13A2495De435a1b15e85b98115Ce05' });
            strict_1.default.equal(res.status, 401);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Looks like you entered the public address of my ethereum wallet!');
        });
        void (0, node_test_1.it)('POST private key in request body gets accepted', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/submitKey')
                .send({ privateKey: '0x5bcc3e9d38baa06e7bfaab80ae5957bbe8ef059e640311d7d6d465e6bc948e3e' });
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, true);
            strict_1.default.equal(res.body.message, 'Challenge successfully solved');
        });
    });
    void (0, node_test_1.describe)('/rest/web3/nftUnlocked', () => {
        void (0, node_test_1.it)('GET solution status of "Unlock NFT" challenge', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/rest/web3/nftUnlocked');
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(typeof res.body.status, 'boolean');
        });
    });
});
//# sourceMappingURL=checkKeys.test.js.map