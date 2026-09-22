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
let authHeader;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    authHeader = { Authorization: `Bearer ${security.authorize()}`, 'content-type': 'application/json' };
}, { timeout: 60000 });
const jsonHeader = { 'content-type': 'application/json' };
void (0, node_test_1.describe)('/api/Users', () => {
    void (0, node_test_1.it)('GET all users is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Users');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET all users', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Users').set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET all users doesnt include passwords', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Users').set(authHeader);
        strict_1.default.equal(res.status, 200);
        for (const user of res.body.data) {
            strict_1.default.equal(user.password, undefined);
        }
    });
    void (0, node_test_1.it)('POST new user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'horst@horstma.nn',
            password: 'hooooorst'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
    });
    void (0, node_test_1.it)('POST new admin', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'horst2@horstma.nn',
            password: 'hooooorst',
            role: 'admin'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
        strict_1.default.equal(res.body.data.role, 'admin');
    });
    void (0, node_test_1.it)('POST new blank user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: ' ',
            password: ' '
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
    });
    void (0, node_test_1.it)('POST same blank user in database', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'blank-duplicate@test.test',
            password: ' '
        });
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'blank-duplicate@test.test',
            password: ' '
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
    });
    void (0, node_test_1.it)('POST whitespaces user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: ' test@gmail.com',
            password: ' test'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
    });
    void (0, node_test_1.it)('POST new deluxe user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'horst3@horstma.nn',
            password: 'hooooorst',
            role: 'deluxe'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
        strict_1.default.equal(res.body.data.role, 'deluxe');
    });
    void (0, node_test_1.it)('POST new accounting user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'horst4@horstma.nn',
            password: 'hooooorst',
            role: 'accounting'
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.id, 'number');
        strict_1.default.equal(typeof res.body.data.createdAt, 'string');
        strict_1.default.equal(typeof res.body.data.updatedAt, 'string');
        strict_1.default.equal(res.body.data.password, undefined);
        strict_1.default.equal(res.body.data.role, 'accounting');
    });
    void (0, node_test_1.it)('POST user not belonging to customer, deluxe, accounting, admin is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set(jsonHeader)
            .send({
            email: 'horst5@horstma.nn',
            password: 'hooooorst',
            role: 'accountinguser'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.message, 'Validation error: Validation isIn on role failed');
        strict_1.default.equal(res.body.errors[0].field, 'role');
        strict_1.default.equal(res.body.errors[0].message, 'Validation isIn on role failed');
    });
    if (utils.isChallengeEnabled(datacache_1.challenges.persistedXssUserChallenge)) {
        void (0, node_test_1.it)('POST new user with XSS attack in email address', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/Users')
                .set(jsonHeader)
                .send({
                email: '<iframe src="javascript:alert(`xss`)">',
                password: 'does.not.matter'
            });
            strict_1.default.equal(res.status, 201);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.email, '<iframe src="javascript:alert(`xss`)">');
        });
    }
});
void (0, node_test_1.describe)('/api/Users/:id', () => {
    void (0, node_test_1.it)('GET existing user by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Users/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update existing user is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Users/1')
            .set(jsonHeader)
            .send({ email: 'administr@t.or' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing user is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Users/1');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET existing user by id', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Users/1').set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('PUT update existing user is forbidden via API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Users/1')
            .set(authHeader)
            .send({ email: 'horst.horstmann@horstma.nn' });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE existing user is forbidden via API even when authenticated', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Users/1').set(authHeader);
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/user/whoami', () => {
    void (0, node_test_1.it)('GET own user id and email on who-am-i request', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami')
            .set({ Cookie: `token=${token}` });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.user.id, 'number');
        strict_1.default.equal(typeof res.body.user.email, 'string');
        strict_1.default.equal(res.body.user.email, 'bjoern.kimminich@gmail.com');
    });
    void (0, node_test_1.it)('GET who-am-i request returns nothing on missing auth token', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/user/whoami');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.deepEqual(res.body.user, {});
    });
    void (0, node_test_1.it)('GET who-am-i request returns nothing on invalid auth token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami')
            .set({ Authorization: 'Bearer InvalidAuthToken' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.deepEqual(res.body.user, {});
    });
    void (0, node_test_1.it)('GET who-am-i request returns nothing on broken auth token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami')
            .set({ Authorization: 'BoarBeatsBear' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.deepEqual(res.body.user, {});
    });
    void (0, node_test_1.it)('GET who-am-i request returns nothing on expired auth token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami')
            .set({ Authorization: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGF0dXMiOiJzdWNjZXNzIiwiZGF0YSI6eyJpZCI6MSwidXNlcm5hbWUiOiIiLCJlbWFpbCI6ImFkbWluQGp1aWNlLXNoLm9wIiwicGFzc3dvcmQiOiIwMTkyMDIzYTdiYmQ3MzI1MDUxNmYwNjlkZjE4YjUwMCIsInJvbGUiOiJhZG1pbiIsImxhc3RMb2dpbklwIjoiMC4wLjAuMCIsInByb2ZpbGVJbWFnZSI6ImRlZmF1bHQuc3ZnIiwidG90cFNlY3JldCI6IiIsImlzQWN0aXZlIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDE5LTA4LTE5IDE1OjU2OjE1LjYyOSArMDA6MDAiLCJ1cGRhdGVkQXQiOiIyMDE5LTA4LTE5IDE1OjU2OjE1LjYyOSArMDA6MDAiLCJkZWxldGVkQXQiOm51bGx9LCJpYXQiOjE1NjYyMzAyMjQsImV4cCI6MTU2NjI0ODIyNH0.FL0kkcInY5sDMGKeLHfEOYDTQd3BjR6_mK7Tcm_RH6iCLotTSRRoRxHpLkbtIQKqBFIt14J4BpLapkzG7ppRWcEley5nego-4iFOmXQvCBz5ISS3HdtM0saJnOe0agyVUen3huFp4F2UCth_y2ScjMn_4AgW66cz8NSFPRVpC8g' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.deepEqual(res.body.user, {});
    });
    void (0, node_test_1.it)('GET who-am-i with fields parameter returns only requested fields', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami?fields=id,email')
            .set({ Cookie: `token=${token}` });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.user.id, 'number');
        strict_1.default.equal(typeof res.body.user.email, 'string');
        strict_1.default.equal(res.body.user.email, 'bjoern.kimminich@gmail.com');
    });
    void (0, node_test_1.it)('GET who-am-i with fields parameter does not return password by default', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami?fields=id,email')
            .set({ Cookie: `token=${token}` });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.user.id, 'number');
        strict_1.default.equal(typeof res.body.user.email, 'string');
    });
    void (0, node_test_1.it)('GET who-am-i with fields parameter can be tricked into returning password', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/whoami?fields=id,email,password')
            .set({ Cookie: `token=${token}` });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.user.id, 'number');
        strict_1.default.equal(typeof res.body.user.email, 'string');
        strict_1.default.equal(typeof res.body.user.password, 'string');
    });
});
//# sourceMappingURL=user.test.js.map