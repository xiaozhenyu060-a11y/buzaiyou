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
const saveLoginIp_1 = require("../../routes/saveLoginIp");
const user_1 = require("../../models/user");
const security = __importStar(require("../../lib/insecurity"));
void (0, node_test_1.describe)('saveLoginIp', () => {
    let req;
    let res;
    let next;
    (0, node_test_1.beforeEach)(() => {
        req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
        res = { json: node_test_1.mock.fn(), sendStatus: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
    });
    void (0, node_test_1.it)('should return 401 if user is not authenticated', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => undefined);
        await (0, saveLoginIp_1.saveLoginIp)()(req, res, next);
        strict_1.default.equal(res.sendStatus.mock.calls.length, 1);
        strict_1.default.equal(res.sendStatus.mock.calls[0].arguments[0], 401);
    });
    void (0, node_test_1.it)('should use the first element if true-client-ip header is an array', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { id: 1 } }));
        req.headers['true-client-ip'] = ['1.1.1.1', '2.2.2.2'];
        const findByPkMock = node_test_1.mock.method(user_1.UserModel, 'findByPk', async () => ({
            update: node_test_1.mock.fn(async (data) => data)
        }));
        await (0, saveLoginIp_1.saveLoginIp)()(req, res, next);
        strict_1.default.equal(findByPkMock.mock.calls.length, 1);
        const updateCall = findByPkMock.mock.calls[0].result;
        const updateMock = (await updateCall).update;
        strict_1.default.equal(updateMock.mock.calls[0].arguments[0].lastLoginIp, '1.1.1.1');
    });
    void (0, node_test_1.it)('should call next with error if update fails', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { id: 1 } }));
        const error = new Error('Update failed');
        node_test_1.mock.method(user_1.UserModel, 'findByPk', async () => ({
            update: node_test_1.mock.fn(async () => { throw error; })
        }));
        await (0, saveLoginIp_1.saveLoginIp)()(req, res, next);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.equal(next.mock.calls[0].arguments[0], error);
    });
});
//# sourceMappingURL=saveLoginIp.unit.test.js.map