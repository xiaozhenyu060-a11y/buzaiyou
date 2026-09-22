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
const config_1 = __importDefault(require("config"));
const setup_1 = require("./helpers/setup");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/user/login', () => {
    void (0, node_test_1.it)('POST login newly created user', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'kalli@kasper.le',
            password: 'kallliiii'
        })
            .expect(201);
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'kalli@kasper.le',
            password: 'kallliiii'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
        strict_1.default.equal(typeof res.body.authentication.umail, 'string');
        strict_1.default.equal(typeof res.body.authentication.bid, 'number');
    });
    void (0, node_test_1.it)('POST login non-existing user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'otto@mei.er',
            password: 'ooootto'
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST login without credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: undefined,
            password: undefined
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST login with admin credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with support-team credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'support@' + config_1.default.get('application.domain'),
            password: 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with MC SafeSearch credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'mc.safesearch@' + config_1.default.get('application.domain'),
            password: 'Mr. N00dles'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with Amy credentials', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'amy@' + config_1.default.get('application.domain'),
            password: 'K1f.....................'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with wurstbrot credentials expects 2FA token', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'wurstbrot@' + config_1.default.get('application.domain'),
            password: 'EinBelegtesBrotMitSchinkenSCHINKEN!'
        });
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.data.tmpToken, 'string');
        strict_1.default.equal(res.body.status, 'totp_token_required');
    });
    void (0, node_test_1.it)('POST login as bjoern.kimminich@gmail.com with known password', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with WHERE-clause disabling SQL injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: '\' or 1=1--',
            password: undefined
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with known email "admin@juice-sh.op" in SQL injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'admin@' + config_1.default.get('application.domain') + '\'--',
            password: undefined
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with known email "jim@juice-sh.op" in SQL injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'jim@' + config_1.default.get('application.domain') + '\'--',
            password: undefined
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with known email "bender@juice-sh.op" in SQL injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bender@' + config_1.default.get('application.domain') + '\'--',
            password: undefined
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with non-existing email "acc0unt4nt@juice-sh.op" via UNION SELECT injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: `' UNION SELECT * FROM (SELECT 15 as 'id', '' as 'username', 'acc0unt4nt@${config_1.default.get('application.domain')}' as 'email', '12345' as 'password', 'accounting' as 'role', '' as deluxeToken, '1.2.3.4' as 'lastLoginIp' , '/assets/public/images/uploads/default.svg' as 'profileImage', '' as 'totpSecret', 1 as 'isActive', '1999-08-16 14:14:41.644 +00:00' as 'createdAt', '1999-08-16 14:33:41.930 +00:00' as 'updatedAt', null as 'deletedAt')--`,
            password: undefined
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
    });
    void (0, node_test_1.it)('POST login with query-breaking SQL Injection attack', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: '\';',
            password: undefined
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/saveLoginIp', () => {
    void (0, node_test_1.it)('GET last login IP will be saved as True-Client-IP header value', async () => {
        const loginRes = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        strict_1.default.equal(loginRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .get('/rest/saveLoginIp')
            .set({
            Authorization: 'Bearer ' + loginRes.body.authentication.token,
            'true-client-ip': '1.2.3.4'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.lastLoginIp, '1.2.3.4');
    });
    void (0, node_test_1.it)('GET last login IP will be saved as remote IP when True-Client-IP is not present', async () => {
        const loginRes = await (0, supertest_1.default)(app)
            .post('/rest/user/login')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern.kimminich@gmail.com',
            password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='
        });
        strict_1.default.equal(loginRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .get('/rest/saveLoginIp')
            .set({
            Authorization: 'Bearer ' + loginRes.body.authentication.token
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.lastLoginIp, '127.0.0.1');
    });
    void (0, node_test_1.it)('GET last login IP returns 401 Unauthorized when no token is provided', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/saveLoginIp');
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=login.test.js.map