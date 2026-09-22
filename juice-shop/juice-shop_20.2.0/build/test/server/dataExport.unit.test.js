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
const dataExport_1 = require("../../routes/dataExport");
const security = __importStar(require("../../lib/insecurity"));
const memory_1 = require("../../models/memory");
const db = __importStar(require("../../data/mongodb"));
void (0, node_test_1.describe)('dataExport', () => {
    let req;
    let res;
    let next;
    (0, node_test_1.beforeEach)(() => {
        req = { headers: {}, body: {}, protocol: 'http', get: node_test_1.mock.fn(() => 'localhost'), socket: { remoteAddress: '127.0.0.1' } };
        res = { status: node_test_1.mock.fn(() => res), send: node_test_1.mock.fn(), json: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
    });
    void (0, node_test_1.it)('should call next with error if user is not authenticated', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'get', () => undefined);
        await (0, dataExport_1.dataExport)()(req, res, next);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
        strict_1.default.match(next.mock.calls[0].arguments[0].message, /Blocked illegal activity/);
    });
    void (0, node_test_1.it)('should call next with error if MemoryModel.findAll fails', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'get', () => ({ data: { id: 1, email: 'test@juice-sh.op', username: 'test' } }));
        const error = new Error('Memory error');
        node_test_1.mock.method(memory_1.MemoryModel, 'findAll', async () => { throw error; });
        await (0, dataExport_1.dataExport)()(req, res, next);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.equal(next.mock.calls[0].arguments[0], error);
    });
    void (0, node_test_1.it)('should call next with error if ordersCollection.find fails', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'get', () => ({ data: { id: 1, email: 'test@juice-sh.op', username: 'test' } }));
        node_test_1.mock.method(memory_1.MemoryModel, 'findAll', async () => []);
        const error = new Error('Orders error');
        node_test_1.mock.method(db.ordersCollection, 'find', async () => { throw error; });
        await (0, dataExport_1.dataExport)()(req, res, next);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.match(next.mock.calls[0].arguments[0].message, /Error retrieving orders/);
    });
    void (0, node_test_1.it)('should call next with error if reviewsCollection.find fails', async () => {
        node_test_1.mock.method(security.authenticatedUsers, 'get', () => ({ data: { id: 1, email: 'test@juice-sh.op', username: 'test' } }));
        node_test_1.mock.method(memory_1.MemoryModel, 'findAll', async () => []);
        node_test_1.mock.method(db.ordersCollection, 'find', async () => []);
        const error = new Error('Reviews error');
        node_test_1.mock.method(db.reviewsCollection, 'find', async () => { throw error; });
        await (0, dataExport_1.dataExport)()(req, res, next);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.match(next.mock.calls[0].arguments[0].message, /Error retrieving reviews/);
    });
});
//# sourceMappingURL=dataExport.unit.test.js.map