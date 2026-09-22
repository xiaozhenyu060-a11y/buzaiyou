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
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
let authHeader;
let addressId;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    const { token } = await (0, auth_1.login)(app, {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
    });
    authHeader = {
        Authorization: 'Bearer ' + token,
        'content-type': 'application/json'
    };
}, { timeout: 60000 });
void (0, node_test_1.describe)('/api/Addresss', () => {
    void (0, node_test_1.it)('GET all addresses is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Addresss');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET all addresses', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Addresss').set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST new address with all valid fields', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Addresss').set(authHeader).send({
            fullName: 'Jim',
            mobileNum: '9800000000',
            zipCode: 'NX 101',
            streetAddress: 'Bakers Street',
            city: 'NYC',
            state: 'NY',
            country: 'USA'
        });
        strict_1.default.equal(res.status, 201);
    });
    void (0, node_test_1.it)('POST new address with invalid pin code', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Addresss').set(authHeader).send({
            fullName: 'Jim',
            mobileNum: '9800000000',
            zipCode: 'NX 10111111',
            streetAddress: 'Bakers Street',
            city: 'NYC',
            state: 'NY',
            country: 'USA'
        });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('POST new address with invalid mobile number', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Addresss').set(authHeader).send({
            fullName: 'Jim',
            mobileNum: '10000000000',
            zipCode: 'NX 101',
            streetAddress: 'Bakers Street',
            city: 'NYC',
            state: 'NY',
            country: 'USA'
        });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('POST new address is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Addresss').send({
            fullName: 'Jim',
            mobileNum: '9800000000',
            zipCode: 'NX 10111111',
            streetAddress: 'Bakers Street',
            city: 'NYC',
            state: 'NY',
            country: 'USA'
        });
        strict_1.default.equal(res.status, 401);
    });
});
void (0, node_test_1.describe)('/api/Addresss/:id', () => {
    (0, node_test_1.before)(async () => {
        const res = await (0, supertest_1.default)(app).post('/api/Addresss').set(authHeader).send({
            fullName: 'Jim',
            mobileNum: '9800000000',
            zipCode: 'NX 101',
            streetAddress: 'Bakers Street',
            city: 'NYC',
            state: 'NY',
            country: 'USA'
        });
        strict_1.default.equal(res.status, 201);
        addressId = res.body.data.id;
    });
    void (0, node_test_1.it)('GET address by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/Addresss/' + addressId);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('PUT update address is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Addresss/' + addressId)
            .set({ 'content-type': 'application/json' })
            .send({ quantity: 2 });
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('DELETE address by id is forbidden via public API', async () => {
        const res = await (0, supertest_1.default)(app).delete('/api/Addresss/' + addressId);
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('GET address by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/Addresss/' + addressId)
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET address by non-existing id returns 400 for authorized user', async () => {
        const nonExistingId = 999999;
        const res = await (0, supertest_1.default)(app)
            .get('/api/Addresss/' + nonExistingId)
            .set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.status, 'error');
        strict_1.default.equal(res.body.data, 'Malicious activity detected.');
    });
    void (0, node_test_1.it)('PUT update address by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Addresss/' + addressId)
            .set(authHeader)
            .send({ fullName: 'Jimy' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.fullName, 'Jimy');
    });
    void (0, node_test_1.it)('PUT update address by id with invalid mobile number is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Addresss/' + addressId)
            .set(authHeader)
            .send({ mobileNum: '10000000000' });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('PUT update address by id with invalid pin code is forbidden', async () => {
        const res = await (0, supertest_1.default)(app)
            .put('/api/Addresss/' + addressId)
            .set(authHeader)
            .send({ zipCode: 'NX 10111111' });
        strict_1.default.equal(res.status, 400);
    });
    void (0, node_test_1.it)('DELETE address by id', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Addresss/' + addressId)
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('DELETE address by id again returns 400 for authorized user', async () => {
        const res = await (0, supertest_1.default)(app)
            .delete('/api/Addresss/' + addressId)
            .set(authHeader);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.status, 'error');
        strict_1.default.equal(res.body.data, 'Malicious activity detected.');
    });
});
//# sourceMappingURL=address.test.js.map