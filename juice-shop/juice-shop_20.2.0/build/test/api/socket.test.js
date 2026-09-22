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
void (0, node_test_1.describe)('WebSocket', () => {
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
    void (0, node_test_1.it)('server handles confirmation messages for emitted challenge resolutions', () => {
        socket.emit('notification received', 'Find the carefully hidden \'Score Board\' page.');
        socket.emit('notification received', 'Provoke an error that is not very gracefully handled.');
        socket.emit('notification received', 'Log in with the administrator\'s user account.');
        socket.emit('notification received', 'Retrieve a list of all user credentials via SQL Injection');
        socket.emit('notification received', 'Post some feedback in another user\'s name.');
        socket.emit('notification received', 'Wherever you go, there you are.');
        socket.emit('notification received', 'Place an order that makes you rich.');
        socket.emit('notification received', 'Access a confidential document.');
        socket.emit('notification received', 'Access a salesman\'s forgotten backup file.');
        socket.emit('notification received', 'Change Bender\'s password into slurmCl4ssic.');
        socket.emit('notification received', 'Apply some advanced cryptanalysis to find the real easter egg.');
        strict_1.default.ok(true);
    });
    void (0, node_test_1.it)('server handles confirmation message for a non-existent challenge', () => {
        socket.emit('notification received', 'Emit a confirmation for a challenge that was never emitted!');
        strict_1.default.ok(true);
    });
    void (0, node_test_1.it)('server handles empty confirmation message', () => {
        socket.emit('notification received', undefined);
        strict_1.default.ok(true);
    });
});
//# sourceMappingURL=socket.test.js.map