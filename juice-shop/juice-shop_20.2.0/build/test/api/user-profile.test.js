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
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
const datacache = __importStar(require("../../data/datacache"));
let app;
let authHeader;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    const { token } = await (0, auth_1.login)(app, { email: 'jim@juice-sh.op', password: 'ncc-1701' });
    authHeader = { Cookie: `token=${token}` };
}, { timeout: 60000 });
void (0, node_test_1.describe)('/profile', () => {
    void (0, node_test_1.it)('GET user profile is forbidden for unauthenticated user', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/profile');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('GET user profile of authenticated user', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('id="email" type="email" name="email" value="jim@juice-sh.op"'));
    });
    void (0, node_test_1.it)('GET user profile contains role and deluxe membership link if user is customer', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('id="role" type="text" name="role" value="customer"'));
        strict_1.default.ok(res.text.includes('href="./#/deluxe-membership"'));
        strict_1.default.ok(res.text.includes('Become a deluxe member'));
    });
    void (0, node_test_1.it)('GET user profile contains role but NO deluxe membership link if user is already deluxe', async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'ciso@juice-sh.op', password: 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb' });
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set('Cookie', `token=${token}`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('id="role" type="text" name="role" value="deluxe"'));
        strict_1.default.ok(!res.text.includes('href="./#/deluxe-membership"'));
        strict_1.default.ok(!res.text.includes('Become a deluxe member'));
    });
    void (0, node_test_1.it)('POST update username of authenticated user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .field('username', 'Localhorst')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST update profile is forbidden for unauthenticated user', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile')
            .field('username', 'Anonhorst');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('GET user profile renders evaluated SSTI payload for username containing valid expression', async () => {
        await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .type('form')
            .send({ username: '#{7*7}' })
            .redirects(0);
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('>49<'));
    });
    void (0, node_test_1.it)('GET user profile falls back gracefully when SSTI payload throws', async () => {
        await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .type('form')
            .send({ username: '#{not_a_defined_symbol}' })
            .redirects(0);
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('not_a_defined_symbol'));
    });
    void (0, node_test_1.it)('GET user profile still evaluates SSTI payload when #{} is NOT at the start of the username', async () => {
        await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .type('form')
            .send({ username: 'A#{7*7}' })
            .redirects(0);
        const res = await (0, supertest_1.default)(app)
            .get('/profile')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('A49'));
    });
    void (0, node_test_1.it)('GET user profile does NOT evaluate SSTI payload in safe mode', async (t) => {
        const originalGet = config_1.default.get.bind(config_1.default);
        t.mock.method(config_1.default, 'get', (setting) => {
            if (setting === 'challenges.safetyMode') {
                return 'enabled';
            }
            return originalGet(setting);
        });
        const challenge = datacache.challenges.usernameXssChallenge;
        const originalDisabledEnv = challenge.disabledEnv;
        challenge.disabledEnv = 'Docker';
        try {
            await (0, supertest_1.default)(app)
                .post('/profile')
                .set('Cookie', authHeader.Cookie)
                .type('form')
                .send({ username: 'A#{7*7}' })
                .redirects(0);
            const res = await (0, supertest_1.default)(app)
                .get('/profile')
                .set(authHeader);
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
            strict_1.default.ok(!res.text.includes('A49'));
            strict_1.default.ok(res.text.includes('A#{7*7}'));
        }
        finally {
            challenge.disabledEnv = originalDisabledEnv;
        }
    });
    void (0, node_test_1.it)('should be solved when origin header matches configured CSRF URL', async () => {
        const csrfUrl = config_1.default.get('challenges.overwriteUrlForCsrfChallenge');
        datacache.challenges.csrfChallenge.solved = false;
        await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .set('Origin', csrfUrl)
            .send({ username: 'CSRF_Victim' })
            .expect(302);
        strict_1.default.equal(datacache.challenges.csrfChallenge.solved, true);
    });
    void (0, node_test_1.it)('should have the configured CSRF URL in the challenge description', async () => {
        const csrfUrl = config_1.default.get('challenges.overwriteUrlForCsrfChallenge');
        strict_1.default.ok(datacache.challenges.csrfChallenge.description.includes(csrfUrl));
    });
    void (0, node_test_1.it)('should NOT be solved when origin header does NOT match configured CSRF URL', async () => {
        datacache.challenges.csrfChallenge.solved = false;
        await (0, supertest_1.default)(app)
            .post('/profile')
            .set('Cookie', authHeader.Cookie)
            .set('Origin', 'http://attacker.com')
            .send({ username: 'No_CSRF' })
            .expect(302);
        strict_1.default.equal(datacache.challenges.csrfChallenge.solved, false);
    });
});
//# sourceMappingURL=user-profile.test.js.map