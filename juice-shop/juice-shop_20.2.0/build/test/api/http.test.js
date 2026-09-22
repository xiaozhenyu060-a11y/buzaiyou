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
void (0, node_test_1.describe)('HTTP', () => {
    void (0, node_test_1.it)('response must contain CORS header allowing all origins', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['access-control-allow-origin'], '*');
    });
    void (0, node_test_1.it)('response must contain sameorigin frameguard header', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    });
    void (0, node_test_1.it)('response must contain CORS header allowing all origins', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['x-content-type-options'], 'nosniff');
    });
    void (0, node_test_1.it)('response must not contain recruiting header', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['x-recruiting'], config_1.default.get('application.securityTxt.hiring'));
    });
    void (0, node_test_1.it)('response must not contain XSS protection header', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['x-xss-protection'], undefined);
    });
    void (0, node_test_1.it)('unexpected path under known sub-path caught by generic error handler', async () => {
        const res = await (0, supertest_1.default)(app).get('/rest/x');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('<title>Error: Unexpected path: /rest/x</title>'));
    });
});
//# sourceMappingURL=http.test.js.map