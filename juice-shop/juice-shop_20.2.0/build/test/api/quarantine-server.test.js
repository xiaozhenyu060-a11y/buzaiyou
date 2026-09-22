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
void (0, node_test_1.describe)('/ftp/quarantine/:file', () => {
    void (0, node_test_1.it)('GET serves a known quarantined file', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/juicy_malware_windows_64.exe.url');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET responds with 403 when filename contains a forward slash', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/' + encodeURIComponent('../package.json'));
        strict_1.default.equal(res.status, 403);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('Error: File names cannot contain forward slashes!'));
    });
});
//# sourceMappingURL=quarantine-server.test.js.map