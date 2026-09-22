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
void (0, node_test_1.describe)('/snippets/:challenge', () => {
    void (0, node_test_1.it)('GET code snippet retrieval for unknown challenge key throws error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/snippets/doesNotExistChallenge');
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.error, 'No code challenge for challenge key: doesNotExistChallenge');
    });
    void (0, node_test_1.it)('GET code snippet retrieval for challenge without code snippet throws error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/snippets/easterEggLevelTwoChallenge');
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.error, 'No code challenge for challenge key: easterEggLevelTwoChallenge');
    });
    void (0, node_test_1.it)('GET code snippet retrieval for challenge with code snippet', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/snippets/loginAdminChallenge');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(typeof res.body.snippet, 'string');
    });
});
void (0, node_test_1.describe)('snippets/verdict', () => {
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
    void (0, node_test_1.it)('should check for the incorrect lines', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({
            selectedLines: [5, 9],
            key: 'resetPasswordJimChallenge'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(typeof res.body.verdict, 'boolean');
        strict_1.default.equal(res.body.verdict, false);
    });
    void (0, node_test_1.it)('should check for the correct lines', async () => {
        const websocketReceivedPromise = new Promise((resolve) => {
            socket.once('code challenge solved', (data) => {
                strict_1.default.deepStrictEqual(data, {
                    key: 'resetPasswordJimChallenge',
                    codingChallengeStatus: 1
                });
                resolve();
            });
        });
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({
            selectedLines: [2],
            key: 'resetPasswordJimChallenge'
        });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(typeof res.body.verdict, 'boolean');
        strict_1.default.equal(res.body.verdict, true);
        await websocketReceivedPromise;
    });
    void (0, node_test_1.it)('POST with unknown challenge key returns 404', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ selectedLines: [1], key: 'doesNotExistChallenge' });
        strict_1.default.equal(res.status, 404);
        strict_1.default.equal(res.body.error, 'No code challenge for challenge key: doesNotExistChallenge');
    });
    void (0, node_test_1.it)('POST without selectedLines returns false verdict', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ key: 'loginBenderChallenge' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
    });
    void (0, node_test_1.it)('POST with empty selectedLines array returns false verdict', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ selectedLines: [], key: 'loginJimChallenge' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
    });
});
// these tests rely on sequential execution to build up the attempt count.
void (0, node_test_1.describe)('snippets/verdict (hint progression for loginAdminChallenge)', () => {
    void (0, node_test_1.it)('returns no hint on the first wrong attempt', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ selectedLines: [999], key: 'loginAdminChallenge' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
        strict_1.default.equal(res.body.hint, undefined);
    });
    void (0, node_test_1.it)('returns the first hint text on the second wrong attempt', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ selectedLines: [999], key: 'loginAdminChallenge' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
        strict_1.default.equal(typeof res.body.hint, 'string');
        strict_1.default.match(res.body.hint, /Try to identify any variables/);
    });
    void (0, node_test_1.it)('returns a line-number hint after all text hints are exhausted', async () => {
        // Exhaust the remaining 2 text hints (3 total, 1 already used above).
        // getFindItAttempts must exceed hints.length (3), requiring a 5th wrong attempt.
        for (let i = 0; i < 2; i++) {
            await (0, supertest_1.default)(app)
                .post('/snippets/verdict')
                .send({ selectedLines: [999], key: 'loginAdminChallenge' });
        }
        const res = await (0, supertest_1.default)(app)
            .post('/snippets/verdict')
            .send({ selectedLines: [999], key: 'loginAdminChallenge' });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.verdict, false);
        strict_1.default.match(res.body.hint, /Line 15 is responsible for this vulnerability/);
    });
});
//# sourceMappingURL=vuln-code-snippet.test.js.map