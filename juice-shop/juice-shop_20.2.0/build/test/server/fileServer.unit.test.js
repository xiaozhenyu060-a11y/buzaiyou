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
const datacache_1 = require("../../data/datacache");
const fileServer_1 = require("../../routes/fileServer");
void (0, node_test_1.describe)('fileServer', () => {
    let req;
    let res;
    let next;
    let save;
    (0, node_test_1.beforeEach)(() => {
        res = { sendFile: node_test_1.mock.fn(), status: node_test_1.mock.fn() };
        req = { params: {}, query: {} };
        next = node_test_1.mock.fn();
        save = () => ({
            then() { }
        });
    });
    void (0, node_test_1.it)('should serve PDF files from folder /ftp', () => {
        req.params.file = 'test.pdf';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]test\.pdf/);
    });
    void (0, node_test_1.it)('should serve Markdown files from folder /ftp', () => {
        req.params.file = 'test.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]test\.md/);
    });
    void (0, node_test_1.it)('should serve incident-support.kdbx files from folder /ftp', () => {
        req.params.file = 'incident-support.kdbx';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]incident-support\.kdbx/);
    });
    void (0, node_test_1.it)('should raise error for slashes in filename', () => {
        req.params.file = '../../../../nice.try';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
    void (0, node_test_1.it)('should raise error for disallowed file type', () => {
        req.params.file = 'nice.try';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
    void (0, node_test_1.it)('should solve "directoryListingChallenge" when requesting acquisitions.md', () => {
        datacache_1.challenges.directoryListingChallenge = { solved: false, save };
        req.params.file = 'acquisitions.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]acquisitions\.md/);
        strict_1.default.equal(datacache_1.challenges.directoryListingChallenge.solved, true);
    });
    void (0, node_test_1.it)('should solve "easterEggLevelOneChallenge" when requesting eastere.gg with Poison Null Byte attack', () => {
        datacache_1.challenges.easterEggLevelOneChallenge = { solved: false, save };
        req.params.file = 'eastere.gg%00.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]eastere\.gg/);
        strict_1.default.equal(datacache_1.challenges.easterEggLevelOneChallenge.solved, true);
    });
    void (0, node_test_1.it)('should solve "forgottenDevBackupChallenge" when requesting package.json.bak with Poison Null Byte attack', () => {
        datacache_1.challenges.forgottenDevBackupChallenge = { solved: false, save };
        req.params.file = 'package.json.bak%00.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]package\.json\.bak/);
        strict_1.default.equal(datacache_1.challenges.forgottenDevBackupChallenge.solved, true);
    });
    void (0, node_test_1.it)('should solve "forgottenBackupChallenge" when requesting coupons_2013.md.bak with Poison Null Byte attack', () => {
        datacache_1.challenges.forgottenBackupChallenge = { solved: false, save };
        req.params.file = 'coupons_2013.md.bak%00.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]coupons_2013\.md\.bak/);
        strict_1.default.equal(datacache_1.challenges.forgottenBackupChallenge.solved, true);
    });
    void (0, node_test_1.it)('should solve "misplacedSignatureFileChallenge" when requesting suspicious_errors.yml with Poison Null Byte attack', () => {
        datacache_1.challenges.misplacedSignatureFileChallenge = { solved: false, save };
        req.params.file = 'suspicious_errors.yml%00.md';
        (0, fileServer_1.servePublicFiles)()(req, res, next);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]suspicious_errors\.yml/);
        strict_1.default.equal(datacache_1.challenges.misplacedSignatureFileChallenge.solved, true);
    });
});
//# sourceMappingURL=fileServer.unit.test.js.map