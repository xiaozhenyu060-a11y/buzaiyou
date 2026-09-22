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
const auth_1 = require("./helpers/auth");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/user/change-password', () => {
    void (0, node_test_1.it)('GET password change for newly created user with recognized token as Authorization header', async () => {
        await (0, supertest_1.default)(app)
            .post('/api/Users')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'kuni@be.rt',
            password: 'kunigunde'
        })
            .expect(201);
        const { token } = await (0, auth_1.login)(app, { email: 'kuni@be.rt', password: 'kunigunde' });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?current=kunigunde&new=foo&repeat=foo')
            .set({ Authorization: 'Bearer ' + token });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET password change with passing wrong current password', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bjoern@' + config_1.default.get('application.domain'),
            password: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?current=definetely_wrong&new=blubb&repeat=blubb')
            .set({ Authorization: 'Bearer ' + token });
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('Current password is not correct'));
    });
    void (0, node_test_1.it)('GET password change without passing any passwords', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password');
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('Password cannot be empty'));
    });
    void (0, node_test_1.it)('GET password change with passing wrong repeated password', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?new=foo&repeat=bar');
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('New and repeated password do not match'));
    });
    void (0, node_test_1.it)('GET password change without passing an authorization token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?new=foo&repeat=foo');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('GET password change with passing unrecognized authorization token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?new=foo&repeat=foo')
            .set({ Authorization: 'Bearer unknown' });
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('GET password change for Bender without current password using GET request', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bender@' + config_1.default.get('application.domain'),
            password: 'OhG0dPlease1nsertLiquor!'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/change-password?new=slurmCl4ssic&repeat=slurmCl4ssic')
            .set({ Authorization: 'Bearer ' + token });
        strict_1.default.equal(res.status, 200);
    });
});
void (0, node_test_1.describe)('/rest/user/reset-password', () => {
    void (0, node_test_1.it)('POST password reset for Jim with correct answer to his security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'jim@' + config_1.default.get('application.domain'),
            answer: 'Samuel',
            new: 'ncc-1701',
            repeat: 'ncc-1701'
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST password reset for Bender with correct answer to his security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bender@' + config_1.default.get('application.domain'),
            answer: 'Stop\'n\'Drop',
            new: 'OhG0dPlease1nsertLiquor!',
            repeat: 'OhG0dPlease1nsertLiquor!'
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST password reset for Bjoern\u00b4s internal account with correct answer to his security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@' + config_1.default.get('application.domain'),
            answer: 'West-2082',
            new: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase',
            repeat: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase'
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST password reset for Bjoern\u00b4s OWASP account with correct answer to his security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@owasp.org',
            answer: 'Zaya',
            new: 'kitten lesser pooch karate buffoon indoors',
            repeat: 'kitten lesser pooch karate buffoon indoors'
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST password reset for Morty with correct answer to his security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'morty@' + config_1.default.get('application.domain'),
            answer: '5N0wb41L',
            new: 'iBurri3dMySe1fInTheB4ckyard!',
            repeat: 'iBurri3dMySe1fInTheB4ckyard!'
        });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST password reset with wrong answer to security question', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@' + config_1.default.get('application.domain'),
            answer: '25436',
            new: '12345',
            repeat: '12345'
        });
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('Wrong answer to security question.'));
    });
    void (0, node_test_1.it)('POST password reset without any data is blocked', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST password reset without new password throws a 401 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@' + config_1.default.get('application.domain'),
            answer: 'W-2082',
            repeat: '12345'
        });
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('Password cannot be empty.'));
    });
    void (0, node_test_1.it)('POST password reset with mismatching passwords throws a 401 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@' + config_1.default.get('application.domain'),
            answer: 'W-2082',
            new: '12345',
            repeat: '1234_'
        });
        strict_1.default.equal(res.status, 401);
        strict_1.default.ok(res.text.includes('New and repeated password do not match.'));
    });
    void (0, node_test_1.it)('POST password reset with no email address throws a 412 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            answer: 'W-2082',
            new: 'abcdef',
            repeat: 'abcdef'
        });
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST password reset with no answer to the security question throws a 412 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/user/reset-password')
            .set({ 'content-type': 'application/json' })
            .send({
            email: 'bjoern@' + config_1.default.get('application.domain'),
            new: 'abcdef',
            repeat: 'abcdef'
        });
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
});
//# sourceMappingURL=password.test.js.map