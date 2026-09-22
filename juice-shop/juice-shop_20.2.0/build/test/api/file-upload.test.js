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
const node_path_1 = __importDefault(require("node:path"));
const datacache_1 = require("../../data/datacache");
const utils = __importStar(require("../../lib/utils"));
const setup_1 = require("./helpers/setup");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/file-upload', () => {
    void (0, node_test_1.it)('POST file valid PDF for client and API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 204);
    });
    void (0, node_test_1.it)('POST file too large for client validation but valid for API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/invalidSizeForClient.pdf');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 204);
    });
    void (0, node_test_1.it)('POST file with illegal type for client validation but valid for API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/invalidTypeForClient.exe');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 204);
    });
    void (0, node_test_1.it)('POST file type XML deprecated for API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/deprecatedTypeForServer.xml');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 410);
    });
    void (0, node_test_1.it)('POST large XML file near upload size limit', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/maxSizeForServer.xml');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 410);
    });
    if (utils.isChallengeEnabled(datacache_1.challenges.xxeFileDisclosureChallenge) || utils.isChallengeEnabled(datacache_1.challenges.xxeDosChallenge)) {
        void (0, node_test_1.it)('POST file type XML with XXE attack against Windows', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/xxeForWindows.xml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.equal(res.status, 410);
        });
        void (0, node_test_1.it)('POST file type XML with XXE attack against Linux', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/xxeForLinux.xml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.equal(res.status, 410);
        });
        void (0, node_test_1.it)('POST file type XML with Billion Laughs attack is caught by parser', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/xxeBillionLaughs.xml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.equal(res.status, 410);
            strict_1.default.ok(res.text.includes('Maximum entity amplification factor exceeded'));
        });
        void (0, node_test_1.it)('POST file type XML with Quadratic Blowup attack', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/xxeQuadraticBlowup.xml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.ok(res.status >= 410);
        });
        void (0, node_test_1.it)('POST file type XML with dev/random attack', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/xxeDevRandom.xml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.ok(res.status >= 410);
        });
    }
    if (utils.isChallengeEnabled(datacache_1.challenges.yamlBombChallenge)) {
        void (0, node_test_1.it)('POST file type YAML with Billion Laughs-style attack', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/yamlBomb.yml');
            const res = await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', file);
            strict_1.default.ok(res.status >= 410);
        });
    }
    void (0, node_test_1.it)('POST file too large for API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/invalidSizeForServer.pdf');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('POST zip file with directory traversal payload', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/arbitraryFileWrite.zip');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 204);
    });
    void (0, node_test_1.it)('POST zip file with password protection', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/passwordProtected.zip');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .attach('file', file);
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('POST valid file with tampered content length', { skip: 'Fails on CI/CD pipeline' }, async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf');
        const res = await (0, supertest_1.default)(app)
            .post('/file-upload')
            .set('Content-Length', '42')
            .attach('file', file);
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Unexpected end of form'));
    });
});
//# sourceMappingURL=file-upload.test.js.map