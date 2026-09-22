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
exports.servePublicFiles = servePublicFiles;
const node_path_1 = __importDefault(require("node:path"));
const security = __importStar(require("../lib/insecurity"));
const datacache_1 = require("../data/datacache");
const challengeUtils = __importStar(require("../lib/challengeUtils"));
function servePublicFiles() {
    return ({ params, query }, res, next) => {
        const file = params.file;
        if (!file.includes('/')) {
            verify(file, res, next);
        }
        else {
            res.status(403);
            next(new Error('File names cannot contain forward slashes!'));
        }
    };
    function verify(file, res, next) {
        if (file && (endsWithAllowlistedFileType(file) || (file === 'incident-support.kdbx'))) {
            file = security.cutOffPoisonNullByte(file);
            challengeUtils.solveIf(datacache_1.challenges.directoryListingChallenge, () => { return file.toLowerCase() === 'acquisitions.md'; });
            verifySuccessfulPoisonNullByteExploit(file);
            res.sendFile(node_path_1.default.resolve('ftp/', file));
        }
        else {
            res.status(403);
            next(new Error('Only .md and .pdf files are allowed!'));
        }
    }
    function verifySuccessfulPoisonNullByteExploit(file) {
        challengeUtils.solveIf(datacache_1.challenges.easterEggLevelOneChallenge, () => { return file.toLowerCase() === 'eastere.gg'; });
        challengeUtils.solveIf(datacache_1.challenges.forgottenDevBackupChallenge, () => { return file.toLowerCase() === 'package.json.bak'; });
        challengeUtils.solveIf(datacache_1.challenges.forgottenBackupChallenge, () => { return file.toLowerCase() === 'coupons_2013.md.bak'; });
        challengeUtils.solveIf(datacache_1.challenges.misplacedSignatureFileChallenge, () => { return file.toLowerCase() === 'suspicious_errors.yml'; });
        challengeUtils.solveIf(datacache_1.challenges.nullByteChallenge, () => {
            return datacache_1.challenges.easterEggLevelOneChallenge.solved || datacache_1.challenges.forgottenDevBackupChallenge.solved || datacache_1.challenges.forgottenBackupChallenge.solved ||
                datacache_1.challenges.misplacedSignatureFileChallenge.solved || file.toLowerCase() === 'encrypt.pyc';
        });
    }
    function endsWithAllowlistedFileType(param) {
        return param.endsWith('.md') || param.endsWith('.pdf');
    }
}
//# sourceMappingURL=fileServer.js.map