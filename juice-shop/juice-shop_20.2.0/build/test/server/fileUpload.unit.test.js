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
const fileUpload_1 = require("../../routes/fileUpload");
void (0, node_test_1.describe)('fileUpload', () => {
    let req;
    let res;
    let save;
    (0, node_test_1.beforeEach)(() => {
        req = { file: { originalname: '' } };
        res = {};
        save = () => ({
            then() { }
        });
    });
    void (0, node_test_1.describe)('should not solve "uploadSizeChallenge" when file size is', () => {
        const sizes = [0, 1, 100, 1000, 10000, 99999, 100000];
        sizes.forEach(size => {
            void (0, node_test_1.it)(`${size} bytes`, () => {
                datacache_1.challenges.uploadSizeChallenge = { solved: false, save };
                req.file.size = size;
                (0, fileUpload_1.checkUploadSize)(req, res, () => { });
                strict_1.default.equal(datacache_1.challenges.uploadSizeChallenge.solved, false);
            });
        });
    });
    void (0, node_test_1.it)('should solve "uploadSizeChallenge" when file size exceeds 100000 bytes', () => {
        datacache_1.challenges.uploadSizeChallenge = { solved: false, save };
        req.file.size = 100001;
        (0, fileUpload_1.checkUploadSize)(req, res, () => { });
        strict_1.default.equal(datacache_1.challenges.uploadSizeChallenge.solved, true);
    });
    void (0, node_test_1.it)('should solve "uploadTypeChallenge" when file type is not PDF', () => {
        datacache_1.challenges.uploadTypeChallenge = { solved: false, save };
        req.file.originalname = 'hack.exe';
        (0, fileUpload_1.checkFileType)(req, res, () => { });
        strict_1.default.equal(datacache_1.challenges.uploadTypeChallenge.solved, true);
    });
    void (0, node_test_1.it)('should not solve "uploadTypeChallenge" when file type is PDF', () => {
        datacache_1.challenges.uploadTypeChallenge = { solved: false, save };
        req.file.originalname = 'hack.pdf';
        (0, fileUpload_1.checkFileType)(req, res, () => { });
        strict_1.default.equal(datacache_1.challenges.uploadTypeChallenge.solved, false);
    });
});
//# sourceMappingURL=fileUpload.unit.test.js.map