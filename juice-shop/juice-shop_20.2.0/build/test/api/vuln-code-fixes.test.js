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
const http = __importStar(require("http"));
const socket_io_client_1 = require("socket.io-client");
const setup_1 = require("./helpers/setup");
const registerWebsocketEvents_1 = __importDefault(require("../../lib/startup/registerWebsocketEvents"));
let app;
let server;
let serverPort;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    await new Promise((resolve) => {
        server = http.createServer(app);
        (0, registerWebsocketEvents_1.default)(server);
        server.listen(0, () => {
            const addr = server.address();
            if (addr && typeof addr === 'object') {
                serverPort = addr.port;
            }
            resolve();
        });
    });
}, { timeout: 60000 });
(0, node_test_1.after)(() => {
    if (server) {
        server.close();
    }
});
void (0, node_test_1.describe)('/snippets/fixes/:key', () => {
    void (0, node_test_1.it)('GET fixes for unknown challenge key throws error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/snippets/fixes/doesNotExistChallenge');
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.error, 'No fixes found for the snippet!');
    });
    void (0, node_test_1.it)('GET fixes for existing challenge key', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/snippets/fixes/resetPasswordBenderChallenge');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(Array.isArray(res.body.fixes));
        strict_1.default.equal(res.body.fixes.length, 3);
        for (const fix of res.body.fixes) {
            strict_1.default.equal(typeof fix, 'string');
        }
    });
});
void (0, node_test_1.describe)('/snippets/fixes', () => {
    let socket;
    (0, node_test_1.beforeEach)(async () => {
        await new Promise((resolve) => {
            socket = (0, socket_io_client_1.io)(`http://localhost:${serverPort}`, {
                reconnectionDelay: 0,
                forceNew: true
            });
            socket.on('connect', () => {
                resolve();
            });
        });
    });
    (0, node_test_1.afterEach)(() => {
        if (socket.connected) {
            socket.disconnect();
        }
    });
    void (0, node_test_1.it)('POST fix for non-existing challenge key throws error', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/fixes')
            .send({
            key: 'doesNotExistChallenge',
            selectedFix: 1
        });
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.error, 'No fixes found for the snippet!');
    });
    void (0, node_test_1.it)('POST wrong fix for existing challenge key gives negative verdict and explanation', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/fixes')
            .send({
            key: 'resetPasswordBenderChallenge',
            selectedFix: 0
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
        strict_1.default.equal(res.body.explanation, 'While not necessarily as trivial to research via a user\'s LinkedIn profile, the question is still easy to research or brute force when answered truthfully.');
    });
    void (0, node_test_1.it)('POST non-existing fix for existing challenge key gives negative verdict and no explanation', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/fixes')
            .send({
            key: 'resetPasswordBenderChallenge',
            selectedFix: 42
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
    });
    void (0, node_test_1.it)('POST correct fix for existing challenge key gives positive verdict and explanation', async () => {
        const websocketReceivedPromise = new Promise((resolve) => {
            socket.once('code challenge solved', (data) => {
                strict_1.default.deepStrictEqual(data, {
                    key: 'resetPasswordBenderChallenge',
                    codingChallengeStatus: 2
                });
                resolve();
            });
        });
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/fixes')
            .send({
            key: 'resetPasswordBenderChallenge',
            selectedFix: 1
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, true);
        strict_1.default.equal(res.body.explanation, 'When answered truthfully, all security questions are susceptible to online research (on Facebook, LinkedIn etc.) and often even brute force. If at all, they should not be used as the only factor for a security-relevant function.');
        await websocketReceivedPromise;
    });
});
//# sourceMappingURL=vuln-code-fixes.test.js.map