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
const webhook = __importStar(require("../../lib/webhook"));
const node_http_1 = __importDefault(require("node:http"));
void (0, node_test_1.describe)('webhook', () => {
    const challenge = {
        key: 'key',
        name: 'name',
        difficulty: 1
    };
    void (0, node_test_1.describe)('notify', () => {
        void (0, node_test_1.it)('ignores errors where no webhook URL is provided via environment variable', async () => {
            try {
                await webhook.notify(challenge);
            }
            catch (error) {
                strict_1.default.fail('webhook.notify should not throw an error when no webhook URL is provided');
            }
        });
        void (0, node_test_1.it)('fails when supplied webhook is not a valid URL', async () => {
            try {
                await webhook.notify(challenge, 0, 0, 0, 'localhorst');
                strict_1.default.fail('Expected error was not thrown');
            }
            catch (error) {
                strict_1.default.equal(error.message, 'Failed to parse URL from localhorst');
            }
        });
        void (0, node_test_1.it)('submits POST with payload to existing URL', async () => {
            const server = node_http_1.default.createServer((req, res) => {
                res.statusCode = 200;
                res.end('OK');
            });
            await new Promise((resolve) => server.listen(0, resolve));
            const port = server.address()?.port;
            const url = `http://localhost:${port}`;
            try {
                await webhook.notify(challenge, 0, 0, 0, url);
            }
            finally {
                server.close();
            }
        });
    });
});
//# sourceMappingURL=webhook.unit.test.js.map