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
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/languages', () => {
    void (0, node_test_1.it)('GET all languages', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/languages');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.ok(Array.isArray(res.body));
        strict_1.default.ok(res.body.length > 0);
        for (const lang of res.body) {
            strict_1.default.equal(typeof lang.key, 'string');
            strict_1.default.equal(typeof lang.lang, 'string');
            if (lang.icons !== undefined)
                strict_1.default.ok(Array.isArray(lang.icons));
            strict_1.default.equal(typeof lang.percentage, 'number');
            if (lang.shortKey !== undefined)
                strict_1.default.equal(typeof lang.shortKey, 'string');
            strict_1.default.equal(typeof lang.gauge, 'string');
        }
    });
});
//# sourceMappingURL=languages.test.js.map