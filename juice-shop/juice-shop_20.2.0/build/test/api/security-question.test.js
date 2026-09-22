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
const security = __importStar(require("../../lib/insecurity"));
const setup_1 = require("./helpers/setup");
let app;
const authHeader = { Authorization: `Bearer ${security.authorize()}`, 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/SecurityQuestions', () => {
    void (0, node_test_1.it)('GET all security questions ', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/SecurityQuestions');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(Array.isArray(res.body.data));
        for (const item of res.body.data) {
            strict_1.default.equal(typeof item.id, 'number');
            strict_1.default.equal(typeof item.question, 'string');
        }
    });
    void (0, node_test_1.it)('POST new security question is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/SecurityQuestions')
            .set(authHeader)
            .send({ question: 'Your own first name?' });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/api/SecurityQuestions/:id', () => {
    void (0, node_test_1.it)('GET existing security question by id is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/SecurityQuestions/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update existing security question is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/SecurityQuestions/1')
            .set(authHeader)
            .send({ question: 'Your own first name?' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing security question is forbidden via public API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/SecurityQuestions/1')
            .set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/user/security-question', () => {
    void (0, node_test_1.it)('GET security question for an existing user\'s email address', async () => {
        const res = await (0, supertest_1.default)(app)
            .get(`/rest/user/security-question?email=jim@${config_1.default.get('application.domain')}`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.question.question, 'Your eldest siblings middle name?');
    });
    void (0, node_test_1.it)('GET security question returns nothing for an unknown email address', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/security-question?email=horst@unknown-us.er');
        strict_1.default.equal(res.status, 200);
        strict_1.default.deepEqual(res.body, {});
    });
    void (0, node_test_1.it)('GET security question throws error for missing email address', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/security-question');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('Error: WHERE parameter &quot;email&quot; has invalid &quot;undefined&quot; value'));
    });
    void (0, node_test_1.it)('GET security question is not susceptible to SQL Injection attacks', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/user/security-question?email=';");
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=security-question.test.js.map