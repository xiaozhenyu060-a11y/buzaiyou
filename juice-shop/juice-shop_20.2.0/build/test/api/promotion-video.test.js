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
void (0, node_test_1.describe)('/promotion', () => {
    void (0, node_test_1.it)('GET promotion video page is publicly accessible', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/promotion');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET promotion video page contains embedded video', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/promotion');
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<source src="./video" type="video/mp4">'));
    });
    void (0, node_test_1.it)('GET promotion video page contains subtitles as <script>', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/promotion');
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<script id="subtitle" type="text/vtt" data-label="English" data-lang="en">'));
    });
});
void (0, node_test_1.describe)('/video', () => {
    void (0, node_test_1.it)('GET promotion video is publicly accessible', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/video');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('video/mp4'));
    });
});
//# sourceMappingURL=promotion-video.test.js.map