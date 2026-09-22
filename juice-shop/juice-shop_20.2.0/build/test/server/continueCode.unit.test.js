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
const datacache_1 = require("../../data/datacache");
const continueCode_1 = require("../../routes/continueCode");
void (0, node_test_1.describe)('continueCode', () => {
    let req;
    let res;
    (0, node_test_1.beforeEach)(() => {
        req = {};
        res = { json: node_test_1.mock.fn() };
    });
    void (0, node_test_1.it)('should be empty when no challenges are solved', () => {
        datacache_1.challenges.scoreBoardChallenge = { solved: false };
        datacache_1.challenges.adminSectionChallenge = { solved: false };
        (0, continueCode_1.continueCode)()(req, res);
        strict_1.default.equal(res.json.mock.calls.length, 1);
        strict_1.default.deepEqual(res.json.mock.calls[0].arguments[0], { continueCode: undefined });
    });
    void (0, node_test_1.it)('should be hashid value of IDs of solved challenges', () => {
        datacache_1.challenges.scoreBoardChallenge = { id: 1, solved: true };
        datacache_1.challenges.adminSectionChallenge = { id: 2, solved: true };
        datacache_1.challenges.continueCodeChallenge = { id: 3, solved: false };
        (0, continueCode_1.continueCode)()(req, res);
        strict_1.default.equal(res.json.mock.calls.length, 1);
        strict_1.default.deepEqual(res.json.mock.calls[0].arguments[0], { continueCode: 'yXjv6Z5jWJnzD6a3YvmwPRXK7roAyzHDde2Og19yEN84plqxkMBbLVQrDeoY' });
    });
});
//# sourceMappingURL=continueCode.unit.test.js.map