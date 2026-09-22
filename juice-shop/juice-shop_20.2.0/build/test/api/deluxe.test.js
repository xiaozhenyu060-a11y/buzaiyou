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
void (0, node_test_1.describe)('/rest/deluxe-membership', () => {
    void (0, node_test_1.it)('GET deluxe membership status for customers', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'bender@' + config_1.default.get('application.domain'),
            password: 'OhG0dPlease1nsertLiquor!'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .get('/rest/deluxe-membership')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.membershipCost, 49);
    });
    void (0, node_test_1.it)('GET deluxe membership status for deluxe members throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'ciso@' + config_1.default.get('application.domain'),
            password: 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .get('/rest/deluxe-membership')
            .set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'You are already a deluxe member!');
    });
    void (0, node_test_1.it)('GET deluxe membership status for admin throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .get('/rest/deluxe-membership')
            .set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'You are not eligible for deluxe membership!');
    });
    void (0, node_test_1.it)('GET deluxe membership status for accountant throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'accountant@' + config_1.default.get('application.domain'),
            password: 'i am an awesome accountant'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .get('/rest/deluxe-membership')
            .set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'You are not eligible for deluxe membership!');
    });
    void (0, node_test_1.it)('POST upgrade deluxe membership status for customers with card payment', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `bender@${config_1.default.get('application.domain')}`,
            password: 'OhG0dPlease1nsertLiquor!'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const cardsRes = await (0, supertest_1.default)(app)
            .get('/api/Cards')
            .set(authHeader);
        strict_1.default.equal(cardsRes.status, 200);
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'card',
            paymentId: cardsRes.body.data[0].id.toString()
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.status, 'success');
    });
    void (0, node_test_1.it)('POST upgrade deluxe membership status for customers with wallet payment', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `mc.safesearch@${config_1.default.get('application.domain')}`,
            password: 'Mr. N00dles'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'wallet'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.status, 'success');
    });
    void (0, node_test_1.it)('POST upgrade deluxe membership fails for customers with insufficient wallet balance', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `amy@${config_1.default.get('application.domain')}`,
            password: 'K1f.....................'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'wallet'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'Insuffienct funds in Wallet');
    });
    void (0, node_test_1.it)('POST deluxe membership status with wrong card id throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'card',
            paymentId: 1337
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'Invalid Card');
    });
    void (0, node_test_1.it)('POST deluxe membership status for deluxe members throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'ciso@' + config_1.default.get('application.domain'),
            password: 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'wallet'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'Something went wrong. Please try again!');
    });
    void (0, node_test_1.it)('POST deluxe membership status for admin throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'admin@' + config_1.default.get('application.domain'),
            password: 'admin123'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'wallet'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'Something went wrong. Please try again!');
    });
    void (0, node_test_1.it)('POST deluxe membership status for accountant throws error', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'accountant@' + config_1.default.get('application.domain'),
            password: 'i am an awesome accountant'
        });
        const authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/deluxe-membership')
            .set(authHeader)
            .send({
            paymentMode: 'wallet'
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'Something went wrong. Please try again!');
    });
});
//# sourceMappingURL=deluxe.test.js.map