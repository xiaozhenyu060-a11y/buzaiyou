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
const setup_1 = require("./helpers/setup");
const challengeUtils = __importStar(require("../../lib/challengeUtils"));
const datacache_1 = require("../../data/datacache");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/repeat-notification', () => {
    void (0, node_test_1.it)('GET triggers repeating notification without passing a challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/repeat-notification');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET triggers repeating notification passing an unsolved challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/repeat-notification?challenge=Retrieve%20Blueprint');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET triggers repeating notification passing a solved challenge', async () => {
        challengeUtils.solveIf(datacache_1.challenges.errorHandlingChallenge, () => true);
        const res = await (0, supertest_1.default)(app)
            .get('/rest/repeat-notification?challenge=Error%20Handling');
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=repeat-notification.test.js.map