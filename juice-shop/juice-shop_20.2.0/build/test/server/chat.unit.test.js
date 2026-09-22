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
const chat = __importStar(require("../../routes/chat"));
const user_1 = require("../../models/user");
const security = __importStar(require("../../lib/insecurity"));
void (0, node_test_1.describe)('chat', () => {
    void (0, node_test_1.describe)('summarizeLlmError', () => {
        void (0, node_test_1.it)('should handle non-Error objects', () => {
            strict_1.default.equal(chat.summarizeLlmError('Simple error string'), 'Simple error string');
            strict_1.default.equal(chat.summarizeLlmError('Multi-line\nerror'), 'Multi-line');
        });
        void (0, node_test_1.it)('should return reachable message for connection errors', () => {
            strict_1.default.equal(chat.summarizeLlmError(new Error('Cannot connect to API')), 'LLM API is not reachable');
            strict_1.default.equal(chat.summarizeLlmError(new Error('ECONNREFUSED')), 'LLM API is not reachable');
        });
        void (0, node_test_1.it)('should return status code if available', () => {
            const error = new Error('Some error');
            error.statusCode = 503;
            strict_1.default.equal(chat.summarizeLlmError(error), 'LLM API returned status 503');
        });
        void (0, node_test_1.it)('should return first line of message otherwise', () => {
            strict_1.default.equal(chat.summarizeLlmError(new Error('First line\nSecond line')), 'First line');
            strict_1.default.equal(chat.summarizeLlmError(new Error('Trailing colon:')), 'Trailing colon');
        });
    });
    void (0, node_test_1.describe)('buildSystemPrompt', () => {
        void (0, node_test_1.it)('should include user name if provided', () => {
            const prompt = chat.buildSystemPrompt('John Doe');
            strict_1.default.ok(prompt.includes('The customer you are currently chatting with is John Doe.'));
        });
        void (0, node_test_1.it)('should not include user name if not provided', () => {
            const prompt = chat.buildSystemPrompt();
            strict_1.default.ok(!prompt.includes('The customer you are currently chatting with is'));
        });
    });
    void (0, node_test_1.describe)('getUserId', () => {
        void (0, node_test_1.it)('should return undefined if no token is present', async () => {
            const userId = await chat.getUserId({ headers: {} });
            strict_1.default.equal(userId, undefined);
        });
        void (0, node_test_1.it)('should return user ID from decoded token', async () => {
            const token = security.authorize({ data: { id: 42 } });
            const req = { headers: { authorization: `Bearer ${token}` } };
            const userId = await chat.getUserId(req);
            strict_1.default.equal(userId, 42);
        });
    });
    void (0, node_test_1.describe)('getUserNameFromToken', () => {
        void (0, node_test_1.it)('should return undefined if no user ID is found', async () => {
            const userName = await chat.getUserNameFromToken({ headers: {} });
            strict_1.default.equal(userName, undefined);
        });
        void (0, node_test_1.it)('should return username from database', async () => {
            const token = security.authorize({ data: { id: 42 } });
            const req = { headers: { authorization: `Bearer ${token}` } };
            node_test_1.mock.method(user_1.UserModel, 'findByPk', async () => ({ username: 'jdoe' }));
            const userName = await chat.getUserNameFromToken(req);
            strict_1.default.equal(userName, 'jdoe');
        });
    });
});
//# sourceMappingURL=chat.unit.test.js.map