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
const auth_1 = require("./helpers/auth");
const datacache_1 = require("../../data/datacache");
const utils = __importStar(require("../../lib/utils"));
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/dataerasure', () => {
    void (0, node_test_1.it)('GET erasure form for logged-in users includes their email and security question', async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'bjoern@owasp.org', password: 'kitten lesser pooch karate buffoon indoors' });
        const res = await (0, supertest_1.default)(app)
            .get('/dataerasure/')
            .set({ Cookie: 'token=' + token });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('bjoern@owasp.org'));
        strict_1.default.ok(res.text.includes('Name of your favorite pet?'));
    });
    void (0, node_test_1.it)('GET erasure form rendering fails for users without assigned security answer', async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
        const res = await (0, supertest_1.default)(app)
            .get('/dataerasure/')
            .set({ Cookie: 'token=' + token });
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: No answer found!'));
    });
    void (0, node_test_1.it)('GET erasure form rendering fails on unauthenticated access', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/dataerasure/');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST erasure request does not actually delete the user', async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
        const res = await (0, supertest_1.default)(app)
            .post('/dataerasure/')
            .set({ Cookie: 'token=' + token })
            .field('email', 'bjoern.kimminich@gmail.com');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        const loginRes = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({ email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
        strict_1.default.equal(loginRes.status, 200);
    });
    void (0, node_test_1.it)('POST erasure form  fails on unauthenticated access', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/dataerasure/');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST erasure request with empty layout parameter returns', async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
        const res = await (0, supertest_1.default)(app)
            .post('/dataerasure/')
            .set({ Cookie: 'token=' + token })
            .send({ layout: null });
        strict_1.default.equal(res.status, 200);
    });
    if (utils.isChallengeEnabled(datacache_1.challenges.lfrChallenge)) {
        void (0, node_test_1.it)('POST erasure request with non-existing file path as layout parameter throws error', async () => {
            const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
            const res = await (0, supertest_1.default)(app)
                .post('/dataerasure/')
                .set({ Cookie: 'token=' + token })
                .send({ layout: '../this/file/does/not/exist' });
            strict_1.default.equal(res.status, 500);
            strict_1.default.ok(res.text.includes('no such file or directory'));
        });
        void (0, node_test_1.it)('POST erasure request with existing file path as layout parameter returns content truncated', async () => {
            const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
            const res = await (0, supertest_1.default)(app)
                .post('/dataerasure/')
                .set({ Cookie: 'token=' + token })
                .send({ layout: '../package.json' });
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.text.includes('juice-shop'));
            strict_1.default.ok(res.text.includes('......'));
        });
    }
});
//# sourceMappingURL=erasure-request.test.js.map