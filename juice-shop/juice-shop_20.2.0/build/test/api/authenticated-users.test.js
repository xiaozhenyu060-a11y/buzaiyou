"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const supertest_1 = __importDefault(require("supertest"));
const security = __importStar(require("../../lib/insecurity"));
const config_1 = __importDefault(require("config"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
const authHeader = { Authorization: `Bearer ${security.authorize({ data: { email: 'admin@juice-sh.op' } })}`, 'content-type': 'application/json' };
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/user/authentication-details', () => {
    void (0, node_test_1.it)('GET all users with password replaced by asterisks', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/authentication-details')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        const userWithAsterisks = res.body.data.find((user) => user.password === '********************************');
        strict_1.default.ok(userWithAsterisks, 'Expected at least one user with password replaced by asterisks');
    });
    void (0, node_test_1.it)('GET returns lastLoginTime for users with active sessions', async () => {
        await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/user/authentication-details')
            .set(authHeader);
        strict_1.default.equal(res.status, 200);
        const jim = res.body.data.find((user) => user.email.startsWith('jim@'));
        strict_1.default.ok(jim, 'Expected to find jim in the user list');
        strict_1.default.equal(typeof jim.lastLoginTime, 'number');
    });
});
//# sourceMappingURL=authenticated-users.test.js.map