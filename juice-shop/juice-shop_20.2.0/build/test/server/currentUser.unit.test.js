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
const currentUser_1 = require("../../routes/currentUser");
const insecurity_1 = require("../../lib/insecurity");
void (0, node_test_1.describe)('currentUser', () => {
    let req;
    let res;
    (0, node_test_1.beforeEach)(() => {
        req = { cookies: {}, query: {} };
        res = { json: node_test_1.mock.fn() };
    });
    void (0, node_test_1.it)('should return neither ID nor email if no cookie was present in the request headers', () => {
        req.cookies.token = '';
        (0, currentUser_1.retrieveLoggedInUser)()(req, res);
        strict_1.default.equal(res.json.mock.calls.length, 1);
        strict_1.default.deepEqual(res.json.mock.calls[0].arguments[0], { user: { id: undefined, email: undefined, lastLoginIp: undefined, profileImage: undefined } });
    });
    void (0, node_test_1.it)('should return ID and email of user belonging to cookie from the request', () => {
        req.cookies.token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRhIjp7ImlkIjoxLCJlbWFpbCI6ImFkbWluQGp1aWNlLXNoLm9wIiwibGFzdExvZ2luSXAiOiIwLjAuMC4wIiwicHJvZmlsZUltYWdlIjoiZGVmYXVsdC5zdmcifSwiaWF0IjoxNTgyMjIyMzY0fQ.CHiFQieZudYlrd1o8Ih-Izv7XY_WZupt8Our-CP9HqsczyEKqrWC7wWguOgVuSGDN_S3mP4FyuEFN8l60aAhVsUbqzFetvJkFwe5nKVhc9dHuen6cujQLMcTlHLKassOSDP41Q-MkKWcUOQu0xUkTMfEq2hPMHpMosDb4benzH0';
        req.query.callback = undefined;
        insecurity_1.authenticatedUsers.put('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRhIjp7ImlkIjoxLCJlbWFpbCI6ImFkbWluQGp1aWNlLXNoLm9wIiwibGFzdExvZ2luSXAiOiIwLjAuMC4wIiwicHJvZmlsZUltYWdlIjoiZGVmYXVsdC5zdmcifSwiaWF0IjoxNTgyMjIyMzY0fQ.CHiFQieZudYlrd1o8Ih-Izv7XY_WZupt8Our-CP9HqsczyEKqrWC7wWguOgVuSGDN_S3mP4FyuEFN8l60aAhVsUbqzFetvJkFwe5nKVhc9dHuen6cujQLMcTlHLKassOSDP41Q-MkKWcUOQu0xUkTMfEq2hPMHpMosDb4benzH0', { data: { id: 1, email: 'admin@juice-sh.op', lastLoginIp: '0.0.0.0', profileImage: '/assets/public/images/uploads/default.svg' } });
        (0, currentUser_1.retrieveLoggedInUser)()(req, res);
        strict_1.default.equal(res.json.mock.calls.length, 1);
        strict_1.default.deepEqual(res.json.mock.calls[0].arguments[0], { user: { id: 1, email: 'admin@juice-sh.op', lastLoginIp: '0.0.0.0', profileImage: '/assets/public/images/uploads/default.svg' } });
    });
});
//# sourceMappingURL=currentUser.unit.test.js.map