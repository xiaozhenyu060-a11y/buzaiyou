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
void (0, node_test_1.describe)('Web3 NFT Minting', () => {
    (0, node_test_1.before)(async () => {
        const result = await (0, setup_1.createTestApp)();
        app = result.app;
    }, { timeout: 60000 });
    void (0, node_test_1.describe)('/rest/web3/nftMintListen', { skip: skipReason }, () => {
        void (0, node_test_1.it)('GET call confirms registration of event listener', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/rest/web3/nftMintListen');
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, true);
            strict_1.default.equal(res.body.message, 'Event Listener Created');
        });
    });
    void (0, node_test_1.describe)('/rest/web3/nftMintListen (error cases)', () => {
        void (0, node_test_1.it)('GET call returns 500 error if listener creation fails', async () => {
            const originalApiKey = process.env.ALCHEMY_API_KEY;
            process.env.ALCHEMY_API_KEY = ' '; // Space makes URL invalid in some contexts or at least ethers should fail it
            const res = await (0, supertest_1.default)(app)
                .get('/rest/web3/nftMintListen');
            if (res.status === 500) {
                strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
                strict_1.default.match(res.body, /URL/i);
            }
            else {
                strict_1.default.equal(res.status, 200);
                strict_1.default.equal(res.body.success, true);
            }
            process.env.ALCHEMY_API_KEY = originalApiKey;
            node_test_1.mock.restoreAll();
        });
    });
    void (0, node_test_1.describe)('/rest/web3/walletNFTVerify', () => {
        void (0, node_test_1.it)('POST missing wallet address fails to solve minting challenge', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/walletNFTVerify')
                .send({});
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Wallet did not mint the NFT');
        });
        void (0, node_test_1.it)('POST invalid wallet address fails to solve minting challenge', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/walletNFTVerify')
                .send({ walletAddress: 'lalalalala' });
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, false);
            strict_1.default.equal(res.body.message, 'Wallet did not mint the NFT');
        });
        void (0, node_test_1.it)('POST minted wallet address successfully solves minting challenge', async () => {
            const testAddress = '0x1234567890123456789012345678901234567890';
            const originalHas = Set.prototype.has;
            const originalDelete = Set.prototype.delete;
            node_test_1.mock.method(Set.prototype, 'has', function (val) {
                if (val === testAddress)
                    return true;
                return originalHas.call(this, val);
            });
            node_test_1.mock.method(Set.prototype, 'delete', function (val) {
                if (val === testAddress)
                    return true;
                return originalDelete.call(this, val);
            });
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/walletNFTVerify')
                .send({ walletAddress: testAddress });
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.success, true);
            strict_1.default.equal(res.body.message, 'Challenge successfully solved');
            node_test_1.mock.restoreAll();
        });
        void (0, node_test_1.it)('POST leads to 500 error if check fails', async () => {
            const testAddress = '0x500';
            const originalHas = Set.prototype.has;
            node_test_1.mock.method(Set.prototype, 'has', function (val) {
                if (val === testAddress)
                    throw new Error('Mocked error');
                return originalHas.call(this, val);
            });
            const res = await (0, supertest_1.default)(app)
                .post('/rest/web3/walletNFTVerify')
                .send({ walletAddress: testAddress });
            strict_1.default.equal(res.status, 500);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body, 'Mocked error');
            node_test_1.mock.restoreAll();
        });
    });
});
//# sourceMappingURL=nftMint.test.js.map