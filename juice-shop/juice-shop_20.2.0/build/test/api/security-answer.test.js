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
const authHeader = { Authorization: `Bearer ${security.authorize()}`, 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/SecurityAnswers', () => {
    void (0, node_test_1.it)('GET all security answers is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/SecurityAnswers')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST new security answer for existing user fails from unique constraint', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/SecurityAnswers')
            .set(authHeader)
            .send({
            UserId: 1,
            SecurityQuestionId: 1,
            answer: 'Horst'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.message, 'Validation error');
    });
});
void (0, node_test_1.describe)('/api/SecurityAnswers/:id', () => {
    void (0, node_test_1.it)('GET existing security answer by id is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/SecurityAnswers/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST security answer for a newly registered user', async () => {
        const userRes = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'new.user@te.st',
            password: '12345'
        });
        strict_1.default.equal(userRes.status, 201);
        const res = await (0, supertest_1.default)(app)
            .post('/api/SecurityAnswers')
            .set(authHeader)
            .send({
            UserId: userRes.body.id,
            SecurityQuestionId: 1,
            answer: 'Horst'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
    });
    void (0, node_test_1.it)('PUT update existing security answer is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/SecurityAnswers/1')
            .set(authHeader)
            .send({
            answer: 'Blurp'
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing security answer is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/SecurityAnswers/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=security-answer.test.js.map