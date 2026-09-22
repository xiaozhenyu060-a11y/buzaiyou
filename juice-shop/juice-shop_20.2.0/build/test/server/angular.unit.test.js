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
const angular_1 = require("../../routes/angular");
void (0, node_test_1.describe)('angular', () => {
    let req;
    let res;
    let next;
    (0, node_test_1.beforeEach)(() => {
        req = {};
        res = { sendFile: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
    });
    void (0, node_test_1.it)('should serve index.html for any URL', () => {
        req.url = '/any/thing';
        (0, angular_1.serveAngularClient)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /index\.html/);
    });
    void (0, node_test_1.it)('should raise error for /api endpoint URL', () => {
        req.url = '/api';
        (0, angular_1.serveAngularClient)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
    void (0, node_test_1.it)('should raise error for /rest endpoint URL', () => {
        req.url = '/rest';
        (0, angular_1.serveAngularClient)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
});
//# sourceMappingURL=angular.unit.test.js.map