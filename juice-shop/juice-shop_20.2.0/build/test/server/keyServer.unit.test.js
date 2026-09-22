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
const keyServer_1 = require("../../routes/keyServer");
void (0, node_test_1.describe)('keyServer', () => {
    let req;
    let res;
    let next;
    (0, node_test_1.beforeEach)(() => {
        req = { params: {} };
        res = { sendFile: node_test_1.mock.fn(), status: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
    });
    void (0, node_test_1.it)('should serve requested file from folder /encryptionkeys', () => {
        req.params.file = 'test.file';
        (0, keyServer_1.serveKeyFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /encryptionkeys[/\\]test.file/);
    });
    void (0, node_test_1.it)('should raise error for slashes in filename', () => {
        req.params.file = '../../../../nice.try';
        (0, keyServer_1.serveKeyFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
});
//# sourceMappingURL=keyServer.unit.test.js.map