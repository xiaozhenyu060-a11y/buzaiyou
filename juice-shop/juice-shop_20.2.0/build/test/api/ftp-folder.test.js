"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const supertest_1 = __importDefault(require("supertest"));
const setup_1 = require("./helpers/setup");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
function responseText(res) {
    return res.text ?? (Buffer.isBuffer(res.body) ? res.body.toString('utf-8') : '');
}
void (0, node_test_1.describe)('/ftp', () => {
    void (0, node_test_1.it)('GET serves a directory listing', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('<title>listing directory /ftp</title>'));
    });
    void (0, node_test_1.it)('GET a non-existing Markdown file in /ftp will return a 404 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/doesnotexist.md');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('GET a non-existing PDF file in /ftp will return a 404 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/doesnotexist.pdf');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('GET a non-existing file in /ftp will return a 403 error for invalid file type', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/doesnotexist.exe');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET an existing file in /ftp will return a 403 error for invalid file type .gg', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/eastere.gg');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET existing file /ftp/coupons_2013.md.bak will return a 403 error for invalid file type .bak', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/coupons_2013.md.bak');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET existing file /ftp/package.json.bak will return a 403 error for invalid file type .bak', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/package.json.bak');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET existing file /ftp/suspicious_errors.yml will return a 403 error for invalid file type .yml', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/suspicious_errors.yml');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET the confidential file in /ftp', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/acquisitions.md');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('# Planned Acquisitions'));
    });
    void (0, node_test_1.it)('GET the KeePass database in /ftp', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/incident-support.kdbx');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET the easter egg file by using Poison Null Byte attack with .pdf suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/eastere.gg%2500.pdf')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('Congratulations, you found the easter egg!'));
    });
    void (0, node_test_1.it)('GET the easter egg file by using Poison Null Byte attack with .md suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/eastere.gg%2500.md')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('Congratulations, you found the easter egg!'));
    });
    void (0, node_test_1.it)('GET the SIEM signature file by using Poison Null Byte attack with .pdf suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/suspicious_errors.yml%2500.pdf')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('Suspicious error messages specific to the application'));
    });
    void (0, node_test_1.it)('GET the SIEM signature file by using Poison Null Byte attack with .md suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/suspicious_errors.yml%2500.md')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('Suspicious error messages specific to the application'));
    });
    void (0, node_test_1.it)('GET the 2013 coupon code file by using Poison Null Byte attack with .pdf suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/coupons_2013.md.bak%2500.pdf')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('n<MibgC7sn'));
    });
    void (0, node_test_1.it)('GET the 2013 coupon code file by using an Poison Null Byte attack with .md suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/coupons_2013.md.bak%2500.md')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('n<MibgC7sn'));
    });
    void (0, node_test_1.it)('GET the package.json.bak file by using Poison Null Byte attack with .pdf suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/package.json.bak%2500.pdf')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('"name": "juice-shop",'));
    });
    void (0, node_test_1.it)('GET the package.json.bak file by using Poison Null Byte attack with .md suffix', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/package.json.bak%2500.md')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('"name": "juice-shop",'));
    });
    void (0, node_test_1.it)('GET a restricted file directly from file system path on server by tricking route definitions fails with 403 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp///eastere.gg');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET a restricted file directly from file system path on server by appending URL parameter fails with 403 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/eastere.gg?.md');
        strict_1.default.equal(res.status, 403);
    });
    void (0, node_test_1.it)('GET a file whose name contains a "/" fails with a 403 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/%2fetc%2fos-release%2500.md');
        strict_1.default.equal(res.status, 403);
        strict_1.default.ok(res.text.includes('Error: File names cannot contain forward slashes!'));
    });
    void (0, node_test_1.it)('GET an accessible file directly from file system path on server', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/legal.md');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('# Legal Information'));
    });
    void (0, node_test_1.it)('GET a non-existing file via direct server file path /ftp will return a 404 error', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/doesnotexist.md');
        strict_1.default.equal(res.status, 404);
    });
    void (0, node_test_1.it)('GET the package.json.bak file contains a dependency on epilogue-js for "Typosquatting" challenge', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/package.json.bak%2500.md')
            .buffer(true);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(responseText(res).includes('"epilogue-js": "~0.7",'));
    });
    void (0, node_test_1.it)('GET file /ftp/quarantine/juicy_malware_linux_amd_64.url', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/juicy_malware_linux_amd_64.url');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET file /ftp/quarantine/juicy_malware_linux_arm_64.url', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/juicy_malware_linux_arm_64.url');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET existing file /ftp/quarantine/juicy_malware_macos_64.url', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/juicy_malware_macos_64.url');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET existing file /ftp/quarantine/juicy_malware_windows_64.exe.url', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/ftp/quarantine/juicy_malware_windows_64.exe.url');
        strict_1.default.equal(res.status, 200);
    });
});
//# sourceMappingURL=ftp-folder.test.js.map