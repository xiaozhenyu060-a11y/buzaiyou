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
const security = __importStar(require("../../lib/insecurity"));
const utils = __importStar(require("../../lib/utils"));
let app;
const authHeader = { Authorization: 'Bearer ' + security.authorize(), 'content-type': 'application/json' };
const jsonHeader = { 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Feedbacks', () => {
    void (0, node_test_1.it)('GET all feedback', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Feedbacks');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST sanitizes unsafe HTML from comment', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            comment: 'I am a harm<script>steal-cookie</script><img src="csrf-attack"/><iframe src="evil-content"></iframe>less comment.',
            rating: 1,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.body.data.comment, 'I am a harmless comment.');
    });
    if (utils.isChallengeEnabled(datacache_1.challenges.persistedXssFeedbackChallenge)) {
        void (0, node_test_1.it)('POST fails to sanitize masked XSS-attack by not applying sanitization recursively', async () => {
            const captchaRes = await (0, supertest_1.default)(app)
                .get('/rest/captcha');
            strict_1.default.equal(captchaRes.status, 200);
            strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
            const res = await (0, supertest_1.default)(app)
                .post('/api/Feedbacks')
                .set(jsonHeader)
                .send({
                comment: 'The sanitize-html module up to at least version 1.4.2 has this issue: <<script>Foo</script>iframe src="javascript:alert(`xss`)">',
                rating: 1,
                captchaId: captchaRes.body.captchaId,
                captcha: captchaRes.body.answer
            });
            strict_1.default.equal(res.status, 201);
            strict_1.default.equal(res.body.data.comment, 'The sanitize-html module up to at least version 1.4.2 has this issue: <iframe src="javascript:alert(`xss`)">');
        });
    }
    void (0, node_test_1.it)('POST feedback in another users name as anonymous user', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            comment: 'Lousy crap! You use sequelize 1.7.x? Welcome to SQL Injection-land, morons! As if that is not bad enough, you use z85/base85 and hashids for crypto? Even MD5 to hash passwords! Srsly?!?!',
            rating: 1,
            UserId: 3,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.UserId, 3);
    });
    void (0, node_test_1.it)('POST feedback in a non-existing users name as anonymous user fails with constraint error', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            comment: 'Pickle Rick says your express-jwt 0.1.3 has Eurogium Edule and Hueteroneel in it!',
            rating: 0,
            UserId: 4711,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(res.body.errors.includes('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed'));
    });
    void (0, node_test_1.it)('POST feedback is associated with current user', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' })
            .send({
            comment: 'Stupid JWT secret and being typosquatted by epilogue-js and ngy-cookie!',
            rating: 5,
            UserId: 4,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.UserId, 4);
    });
    void (0, node_test_1.it)('POST feedback is associated with any passed user ID', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' })
            .send({
            comment: 'Bender\'s choice award!',
            rating: 5,
            UserId: 3,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.UserId, 3);
    });
    void (0, node_test_1.it)('POST feedback can be created without actually supplying comment', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            rating: 1,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.comment, null);
        strict_1.default.equal(res.body.data.rating, 1);
    });
    void (0, node_test_1.it)('POST feedback cannot be created without actually supplying rating', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.message, 'string');
        strict_1.default.ok(res.body.message.match(/notNull Violation: (Feedback\.)?rating cannot be null/));
    });
    void (0, node_test_1.it)('POST feedback cannot be created with wrong CAPTCHA answer', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            rating: 1,
            captchaId: captchaRes.body.captchaId,
            captcha: (captchaRes.body.answer + 1)
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST feedback cannot be created with invalid CAPTCHA id', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const res = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            rating: 1,
            captchaId: 999999,
            captcha: 42
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/api/Feedbacks/:id', () => {
    void (0, node_test_1.it)('GET existing feedback by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Feedbacks/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET existing feedback by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Feedbacks/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT update existing feedback is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Feedbacks/1')
            .set(jsonHeader)
            .send({
            comment: 'This sucks like nothing has ever sucked before',
            rating: 1
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update existing feedback', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Feedbacks/2')
            .set(authHeader)
            .send({
            rating: 0
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing feedback is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Feedbacks/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing feedback', async () => {
        const captchaRes = await (0, supertest_1.default)(app)
            .get('/rest/captcha');
        strict_1.default.equal(captchaRes.status, 200);
        strict_1.default.ok(captchaRes.headers['content-type']?.includes('application/json'));
        const createRes = await (0, supertest_1.default)(app)
            .post('/api/Feedbacks')
            .set(jsonHeader)
            .send({
            comment: 'I will be gone soon!',
            rating: 1,
            captchaId: captchaRes.body.captchaId,
            captcha: captchaRes.body.answer
        });
        strict_1.default.equal(createRes.status, 201);
        strict_1.default.equal(typeof createRes.body.data.id, 'number');
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Feedbacks/' + createRes.body.data.id)
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=feedback.test.js.map