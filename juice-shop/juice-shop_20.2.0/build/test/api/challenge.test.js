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
const challengeDependency_1 = require("../../models/challengeDependency");
let app;
const authHeader = { Authorization: 'Bearer ' + security.authorize(), 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    (0, challengeDependency_1.ChallengeDependencyModelInit)(result.sequelize);
    await result.sequelize.sync();
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Challenges', () => {
    void (0, node_test_1.it)('GET all challenges', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Challenges');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(Array.isArray(res.body.data));
        for (const item of res.body.data) {
            strict_1.default.equal(typeof item.id, 'number');
            strict_1.default.equal(typeof item.key, 'string');
            strict_1.default.equal(typeof item.name, 'string');
            strict_1.default.equal(typeof item.description, 'string');
            strict_1.default.equal(typeof item.difficulty, 'number');
            strict_1.default.equal(typeof item.solved, 'boolean');
        }
    });
    void (0, node_test_1.it)('POST new challenge is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Challenges')
            .set(authHeader)
            .send({
            name: 'Invulnerability',
            description: 'I am not a vulnerability!',
            difficulty: 3,
            solved: false
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/api/Challenges/:id', () => {
    void (0, node_test_1.it)('GET existing challenge by id is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Challenges/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update existing challenge is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Challenges/1')
            .set(authHeader)
            .send({
            name: 'Vulnerability',
            description: 'I am a vulnerability!!!',
            difficulty: 3
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing challenge is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Challenges/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/continue-code', () => {
    void (0, node_test_1.it)('GET can retrieve continue code for currently solved challenges', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/continue-code');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT invalid continue code is rejected (alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code/apply/ThisIsDefinitelyNotAValidContinueCode');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT invalid continue code is rejected (non-alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code/apply/%3Cimg%20src=nonexist1%20onerror=alert()%3E');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT continue code for more than one challenge is accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code/apply/yXjv6Z5jWJnzD6a3YvmwPRXK7roAyzHDde2Og19yEN84plqxkMBbLVQrDeoY');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT continue code for non-existent challenge #999 is accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code/apply/69OxrZ8aJEgxONZyWoz1Dw4BvXmRGkM6Ae9M7k2rK63YpqQLPjnlb5V5LvDj');
        strict_1.default.equal(res.status, 200);
    });
});
void (0, node_test_1.describe)('/rest/continue-code-findIt', () => {
    void (0, node_test_1.it)('GET can retrieve continue code for currently solved challenges', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/continue-code-findIt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT invalid continue code is rejected (alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-findIt/apply/ThisIsDefinitelyNotAValidContinueCode');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT completely invalid continue code is rejected (non-alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-findIt/apply/%3Cimg%20src=nonexist1%20onerror=alert()%3E');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT continue code for more than one challenge is accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-findIt/apply/Xg9oK0VdbW5g1KX9G7JYnqLpz3rAPBh6p4eRlkDM6EaBON2QoPmxjyvwMrP6');
        strict_1.default.equal(res.status, 200);
    });
});
void (0, node_test_1.describe)('/rest/continue-code-fixIt', () => {
    void (0, node_test_1.it)('GET can retrieve continue code for currently solved challenges', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/continue-code-fixIt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT invalid continue code is rejected (alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-fixIt/apply/ThisIsDefinitelyNotAValidContinueCode');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT completely invalid continue code is rejected (non-alphanumeric)', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-fixIt/apply/%3Cimg%20src=nonexist1%20onerror=alert()%3E');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('PUT continue code for more than one challenge is accepted', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/rest/continue-code-fixIt/apply/y28BEPE2k3yRrdz5p6DGqJONnj41n5UEWawYWgBMoVmL79bKZ8Qve0Xl5QLW');
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=challenge.test.js.map