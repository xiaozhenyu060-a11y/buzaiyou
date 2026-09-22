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
void (0, node_test_1.describe)('/api', () => {
    void (0, node_test_1.it)('GET error when query /api without actual resource', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api');
        strict_1.default.equal(res.status, 500);
    });
});
void (0, node_test_1.describe)('/rest', () => {
    void (0, node_test_1.it)('GET error message with information leakage when calling unrecognized path with /rest in it', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/unrecognized');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('<h1>' + config_1.default.get('application.name') + ' (Express'));
        strict_1.default.ok(res.text.includes('Unexpected path: /rest/unrecognized'));
    });
});
//# sourceMappingURL=api.test.js.map