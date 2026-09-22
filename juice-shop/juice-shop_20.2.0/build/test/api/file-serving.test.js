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
const config_1 = __importDefault(require("config"));
const setup_1 = require("./helpers/setup");
const utils = __importStar(require("../../lib/utils"));
let app;
let blueprint;
for (const product of config_1.default.get('products')) {
    if (product.fileForRetrieveBlueprintChallenge) {
        blueprint = product.fileForRetrieveBlueprintChallenge;
        break;
    }
}
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('Server', () => {
    void (0, node_test_1.it)('GET responds with index.html when visiting application URL', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('scripts.js'));
        strict_1.default.ok(res.text.includes('main.js'));
        strict_1.default.ok(res.text.includes('polyfills.js'));
    });
    void (0, node_test_1.it)('GET responds with index.html when visiting application URL with any path', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/whatever');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('scripts.js'));
        strict_1.default.ok(res.text.includes('main.js'));
        strict_1.default.ok(res.text.includes('polyfills.js'));
    });
    void (0, node_test_1.it)('GET a restricted file directly from file system path on server via URL-encoded Directory Traversal attack loads index.html instead', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/public/images/%2e%2e%2f%2e%2e%2fftp/eastere.gg');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('<meta name="description" content="Probably the most modern and sophisticated insecure web application">'));
    });
    void (0, node_test_1.it)('GET serves a security.txt file', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/security.txt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a security.txt file under well-known subfolder', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/.well-known/security.txt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a robots.txt file', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/robots.txt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a csaf provider-metadata.json', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/.well-known/csaf/provider-metadata.json');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a csaf index.txt', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/.well-known/csaf/index.txt');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a csaf changes.csv', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/.well-known/csaf/changes.csv');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET serves a csaf juice-shop-sa-20200513-express-jwt.json', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/.well-known/csaf/2017/juice-shop-sa-20200513-express-jwt.json');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('juice-shop-sa-20200513-express-jwt'));
        strict_1.default.ok(res.text.includes('We will soon release a patch'));
    });
});
void (0, node_test_1.describe)('/public/images/padding', () => {
    void (0, node_test_1.it)('GET tracking image for "Score Board" page access challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/padding/1px.png');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['content-type'], 'image/png');
    });
    void (0, node_test_1.it)('GET tracking image for "Administration" page access challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/padding/19px.png');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['content-type'], 'image/png');
    });
    void (0, node_test_1.it)('GET tracking image for "Token Sale" page access challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/padding/56px.png');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['content-type'], 'image/png');
    });
    void (0, node_test_1.it)('GET tracking image for "Privacy Policy" page access challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/padding/81px.png');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['content-type'], 'image/png');
    });
});
void (0, node_test_1.describe)('/encryptionkeys', () => {
    void (0, node_test_1.it)('GET serves a directory listing', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/encryptionkeys');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<title>listing directory /encryptionkeys</title>'));
    });
    void (0, node_test_1.it)('GET a non-existing file in will return a 404 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/encryptionkeys/doesnotexist.md');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('GET the Premium Content AES key', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/encryptionkeys/premium.key');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET a key file whose name contains a "/" fails with a 403 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/encryptionkeys/%2fetc%2fos-release%2500.md');
        strict_1.default.equal(res.status, 403);
        strict_1.default.ok(res.text.includes('Error: File names cannot contain forward slashes!'));
    });
});
void (0, node_test_1.describe)('Hidden URL', () => {
    void (0, node_test_1.it)('GET the second easter egg by visiting the Base64>ROT13-decrypted URL', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/the/devs/are/so/funny/they/hid/an/easter/egg/within/the/easter/egg');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<title>Welcome to Planet Orangeuze</title>'));
    });
    void (0, node_test_1.it)('GET the premium content by visiting the AES decrypted URL', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/this/page/is/hidden/behind/an/incredibly/high/paywall/that/could/only/be/unlocked/by/sending/1btc/to/us');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.headers['content-type'], 'image/jpeg');
    });
    void (0, node_test_1.it)('GET the missing "Thank you!" image for assembling the URL hidden in the Privacy Policy', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/we/may/also/instruct/you/to/refuse/all/reasonably/necessary/responsibility');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('GET Klingon translation file for "Extra Language" challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/i18n/tlh_AA.json');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
    });
    void (0, node_test_1.it)('GET blueprint file for "Retrieve Blueprint" challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/products/' + blueprint);
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET crazy cat photo for "Missing Encoding" challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/assets/public/images/uploads/%E1%93%9A%E1%98%8F%E1%97%A2-%23zatschi-%23whoneedsfourlegs-1572600969477.jpg');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET folder containing access log files for "Access Log" challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/support/logs/access.log.' + utils.toISO8601(new Date()));
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/octet-stream'));
    });
});
//# sourceMappingURL=file-serving.test.js.map