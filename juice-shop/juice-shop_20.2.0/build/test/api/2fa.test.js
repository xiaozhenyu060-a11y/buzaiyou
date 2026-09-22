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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otplib_1 = require("otplib");
const security = __importStar(require("../../lib/insecurity"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
const jsonHeader = { 'content-type': 'application/json' };
let app;
function getStatus(token) {
    return (0, supertest_1.default)(app)
        .get('/rest/2fa/status')
        .set({
        Authorization: 'Bearer ' + token,
        'content-type': 'application/json'
    });
}
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/2fa/verify', () => {
    void (0, node_test_1.it)('POST should return a valid authentication when a valid tmp token is passed', async () => {
        const tmpTokenWurstbrot = security.authorize({
            userId: 10,
            type: 'password_valid_needs_second_factor_token'
        });
        const totpToken = (0, otplib_1.generateSync)({ secret: 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH' });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: tmpTokenWurstbrot,
            totpToken
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.authentication.token, 'string');
        strict_1.default.equal(typeof res.body.authentication.umail, 'string');
        strict_1.default.equal(typeof res.body.authentication.bid, 'number');
        strict_1.default.equal(res.body.authentication.umail, `wurstbrot@${config_1.default.get('application.domain')}`);
    });
    void (0, node_test_1.it)('POST should fail if a invalid totp token is used', async () => {
        const tmpTokenWurstbrot = security.authorize({
            userId: 10,
            type: 'password_valid_needs_second_factor_token'
        });
        const totpToken = (0, otplib_1.generateSync)({ secret: 'BI6KJAURX3LL5VQI2ZBFVLUWSBYBDX4H' });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: tmpTokenWurstbrot,
            totpToken
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if a unsigned tmp token is used', async () => {
        const tmpTokenWurstbrot = jsonwebtoken_1.default.sign({
            userId: 10,
            type: 'password_valid_needs_second_factor_token'
        }, 'this_surly_isnt_the_right_key');
        const totpToken = (0, otplib_1.generateSync)({ secret: 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH' });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: tmpTokenWurstbrot,
            totpToken
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the token type is invalid', async () => {
        const tmpTokenWurstbrot = security.authorize({
            userId: 10,
            type: 'invalid_token_type'
        });
        const totpToken = (0, otplib_1.generateSync)({ secret: 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH' });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: tmpTokenWurstbrot,
            totpToken
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the user doesn\'t exist', async () => {
        const tmpTokenWurstbrot = security.authorize({
            userId: 999,
            type: 'password_valid_needs_second_factor_token'
        });
        const totpToken = (0, otplib_1.generateSync)({ secret: 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH' });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: tmpTokenWurstbrot,
            totpToken
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/2fa/status', () => {
    void (0, node_test_1.it)('GET should indicate 2fa is setup for 2fa enabled users', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `wurstbrot@${config_1.default.get('application.domain')}`,
            password: 'EinBelegtesBrotMitSchinkenSCHINKEN!',
            totpSecret: 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH'
        });
        const res = await getStatus(token);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.setup, 'boolean');
        strict_1.default.equal(res.body.setup, true);
    });
    void (0, node_test_1.it)('GET should indicate 2fa is not setup for users with 2fa disabled', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `J12934@${config_1.default.get('application.domain')}`,
            password: '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB'
        });
        const res = await getStatus(token);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(typeof res.body.setup, 'boolean');
        strict_1.default.equal(typeof res.body.secret, 'string');
        strict_1.default.equal(typeof res.body.email, 'string');
        strict_1.default.equal(typeof res.body.setupToken, 'string');
        strict_1.default.equal(res.body.setup, false);
        strict_1.default.equal(res.body.email, `J12934@${config_1.default.get('application.domain')}`);
    });
    void (0, node_test_1.it)('GET should return 401 when not logged in', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/2fa/status');
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/2fa/setup', () => {
    void (0, node_test_1.it)('POST should be able to setup 2fa for accounts without 2fa enabled', async () => {
        const email = 'fooooo1@bar.com';
        const password = '123456';
        const secret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password });
        const { token } = await (0, auth_1.login)(app, { email, password });
        const setupRes = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret })
        });
        strict_1.default.equal(setupRes.status, 200);
        const statusRes = await getStatus(token);
        strict_1.default.equal(statusRes.status, 200);
        strict_1.default.equal(typeof statusRes.body.setup, 'boolean');
        strict_1.default.equal(statusRes.body.setup, true);
    });
    void (0, node_test_1.it)('POST should fail if the password doesnt match', async () => {
        const email = 'fooooo2@bar.com';
        const password = '123456';
        const secret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password });
        const { token } = await (0, auth_1.login)(app, { email, password });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password: password + ' this makes the password wrong',
            setupToken: security.authorize({
                secret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret })
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the initial token is incorrect', async () => {
        const email = 'fooooo3@bar.com';
        const password = '123456';
        const secret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password });
        const { token } = await (0, auth_1.login)(app, { email, password });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret: 'OJQOJNTB46VLWUO4TVKXIULU2WLPFQOJ' })
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the token is of the wrong type', async () => {
        const email = 'fooooo4@bar.com';
        const password = '123456';
        const secret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password });
        const { token } = await (0, auth_1.login)(app, { email, password });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret,
                type: 'totp_setup_secret_foobar'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret })
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the account has already set up 2fa', async () => {
        const email = `wurstbrot@${config_1.default.get('application.domain')}`;
        const password = 'EinBelegtesBrotMitSchinkenSCHINKEN!';
        const totpSecret = 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH';
        const { token } = await (0, auth_1.login)(app, { email, password, totpSecret });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret: totpSecret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret: totpSecret })
        });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST should fail if the user doesn\'t exist', async () => {
        const email = 'nonexistent@bar.com';
        const password = '123456';
        const secret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        const token = security.authorize({
            data: {
                id: 999,
                email,
                password: security.hash(password),
                totpSecret: ''
            }
        });
        security.authenticatedUsers.put(token, security.decode(token));
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret })
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/rest/2fa/disable', () => {
    void (0, node_test_1.it)('POST should be able to disable 2fa for account with 2fa enabled', async () => {
        const email = 'fooooodisable1@bar.com';
        const password = '123456';
        const totpSecret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password, totpSecret });
        const { token } = await (0, auth_1.login)(app, { email, password, totpSecret });
        const statusRes1 = await getStatus(token);
        strict_1.default.equal(statusRes1.status, 200);
        strict_1.default.equal(statusRes1.body.setup, true);
        const disableRes = await (0, supertest_1.default)(app)
            .post('/rest/2fa/disable')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({ password });
        strict_1.default.equal(disableRes.status, 200);
        const statusRes2 = await getStatus(token);
        strict_1.default.equal(statusRes2.status, 200);
        strict_1.default.equal(statusRes2.body.setup, false);
    });
    void (0, node_test_1.it)('POST should not be possible to disable 2fa without the correct password', async () => {
        const email = 'fooooodisable2@bar.com';
        const password = '123456';
        const totpSecret = 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7';
        await (0, auth_1.register)(app, { email, password, totpSecret });
        const { token } = await (0, auth_1.login)(app, { email, password, totpSecret });
        const statusRes1 = await getStatus(token);
        strict_1.default.equal(statusRes1.status, 200);
        strict_1.default.equal(statusRes1.body.setup, true);
        const disableRes = await (0, supertest_1.default)(app)
            .post('/rest/2fa/disable')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({ password: password + ' this makes the password wrong' });
        strict_1.default.equal(disableRes.status, 401);
        const statusRes2 = await getStatus(token);
        strict_1.default.equal(statusRes2.status, 200);
        strict_1.default.equal(statusRes2.body.setup, true);
    });
    void (0, node_test_1.it)('POST should fail if the user doesn\'t exist', async () => {
        const email = 'nonexistent-disable@bar.com';
        const password = '123456';
        const token = security.authorize({
            data: {
                id: 998,
                email,
                password: security.hash(password),
                totpSecret: 'KDR5FXSOLNV6A5UAQYCKROSJZF7SVML7'
            }
        });
        security.authenticatedUsers.put(token, security.decode(token));
        const res = await (0, supertest_1.default)(app)
            .post('/rest/2fa/disable')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({ password });
        strict_1.default.equal(res.status, 401);
    });
});
//# sourceMappingURL=2fa.test.js.map