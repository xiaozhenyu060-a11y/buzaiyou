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
void (0, node_test_1.describe)('/api/Deliverys', () => {
    void (0, node_test_1.describe)('for regular customer', () => {
        let authHeader;
        (0, node_test_1.before)(async () => {
            const { token } = await (0, auth_1.login)(app, {
                email: 'jim@' + config_1.default.get('application.domain'),
                password: 'ncc-1701'
            });
            authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        });
        void (0, node_test_1.it)('GET delivery methods', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/Deliverys')
                .set(authHeader);
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.length, 3);
            strict_1.default.equal(res.body.data[0].id, 1);
            strict_1.default.equal(res.body.data[0].name, 'One Day Delivery');
            strict_1.default.equal(res.body.data[0].price, 0.99);
            strict_1.default.equal(res.body.data[0].eta, 1);
        });
    });
    void (0, node_test_1.describe)('for deluxe customer', () => {
        let authHeader;
        (0, node_test_1.before)(async () => {
            const { token } = await (0, auth_1.login)(app, {
                email: 'ciso@' + config_1.default.get('application.domain'),
                password: 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb'
            });
            authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        });
        void (0, node_test_1.it)('GET delivery methods', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/Deliverys')
                .set(authHeader);
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.length, 3);
            strict_1.default.equal(res.body.data[0].id, 1);
            strict_1.default.equal(res.body.data[0].name, 'One Day Delivery');
            strict_1.default.equal(res.body.data[0].price, 0.5);
            strict_1.default.equal(res.body.data[0].eta, 1);
        });
    });
});
void (0, node_test_1.describe)('/api/Deliverys/:id', () => {
    void (0, node_test_1.describe)('for regular customer', () => {
        let authHeader;
        (0, node_test_1.before)(async () => {
            const { token } = await (0, auth_1.login)(app, {
                email: 'jim@' + config_1.default.get('application.domain'),
                password: 'ncc-1701'
            });
            authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        });
        void (0, node_test_1.it)('GET delivery method', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/Deliverys/2')
                .set(authHeader);
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.id, 2);
            strict_1.default.equal(res.body.data.name, 'Fast Delivery');
            strict_1.default.equal(res.body.data.price, 0.5);
            strict_1.default.equal(res.body.data.eta, 3);
        });
        void (0, node_test_1.it)('GET non-existing delivery method returns 400', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/Deliverys/999999')
                .set(authHeader);
            strict_1.default.equal(res.status, 400);
        });
    });
    void (0, node_test_1.describe)('for deluxe customer', () => {
        let authHeader;
        (0, node_test_1.before)(async () => {
            const { token } = await (0, auth_1.login)(app, {
                email: 'ciso@' + config_1.default.get('application.domain'),
                password: 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb'
            });
            authHeader = { Authorization: 'Bearer ' + token, 'content-type': 'application/json' };
        });
        void (0, node_test_1.it)('GET delivery method', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/Deliverys/2')
                .set(authHeader);
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
            strict_1.default.equal(res.body.data.id, 2);
            strict_1.default.equal(res.body.data.name, 'Fast Delivery');
            strict_1.default.equal(res.body.data.price, 0);
            strict_1.default.equal(res.body.data.eta, 3);
        });
    });
});
//# sourceMappingURL=delivery.test.js.map