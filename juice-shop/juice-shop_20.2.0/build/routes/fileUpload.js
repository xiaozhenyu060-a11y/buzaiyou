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
exports.ensureFileIsPassed = ensureFileIsPassed;
exports.handleZipFileUpload = handleZipFileUpload;
exports.checkUploadSize = checkUploadSize;
exports.checkFileType = checkFileType;
exports.handleXmlUpload = handleXmlUpload;
exports.handleYamlUpload = handleYamlUpload;
const node_fs_1 = __importDefault(require("node:fs"));
const node_vm_1 = __importDefault(require("node:vm"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:stream/promises");
const js_yaml_1 = __importDefault(require("js-yaml"));
const unzipper_1 = __importDefault(require("unzipper"));
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const utils = __importStar(require("../lib/utils"));
const xml_1 = require("../lib/xml");
function ensureFileIsPassed({ file }, res, next) {
    if (file != null) {
        next();
    }
    else {
        return res.status(400).json({ error: 'File is not passed' });
    }
}
async function extractZipBuffer(buffer) {
    const directory = await unzipper_1.default.Open.buffer(buffer);
    for (const entry of directory.files) {
        const fileName = entry.path;
        const absolutePath = node_path_1.default.resolve('uploads/complaints/' + fileName);
        challengeUtils.solveIf(datacache_1.challenges.fileWriteChallenge, () => { return absolutePath === node_path_1.default.resolve('ftp/legal.md'); });
        if (absolutePath.includes(node_path_1.default.resolve('.'))) {
            await (0, promises_1.pipeline)(entry.stream(), node_fs_1.default.createWriteStream('uploads/complaints/' + fileName));
        }
    }
}
async function handleZipFileUpload({ file }, res, next) {
    if (!(file?.originalname?.toLowerCase().endsWith('.zip') ?? false)) {
        next();
        return;
    }
    if (((file?.buffer) != null) && utils.isChallengeEnabled(datacache_1.challenges.fileWriteChallenge)) {
        try {
            await extractZipBuffer(file.buffer);
        }
        catch (err) {
            next(err);
            return;
        }
    }
    res.status(204).end();
}
function checkUploadSize({ file }, res, next) {
    if (file != null) {
        challengeUtils.solveIf(datacache_1.challenges.uploadSizeChallenge, () => { return file?.size > 100000; });
    }
    next();
}
function checkFileType({ file }, res, next) {
    const fileType = file?.originalname.substr(file.originalname.lastIndexOf('.') + 1).toLowerCase();
    challengeUtils.solveIf(datacache_1.challenges.uploadTypeChallenge, () => {
        return !(fileType === 'pdf' || fileType === 'xml' || fileType === 'zip' || fileType === 'yml' || fileType === 'yaml');
    });
    next();
}
async function handleXmlUpload({ file }, res, next) {
    if (file?.originalname?.toLowerCase().endsWith('.xml') ?? false) {
        challengeUtils.solveIf(datacache_1.challenges.deprecatedInterfaceChallenge, () => { return true; });
        if (((file?.buffer) != null) && utils.isChallengeEnabled(datacache_1.challenges.deprecatedInterfaceChallenge)) { // XXE attacks in Docker/Heroku containers regularly cause "segfault" crashes
            const data = file.buffer.toString();
            try {
                const xmlString = await (0, xml_1.parseXmlString)(data);
                challengeUtils.solveIf(datacache_1.challenges.xxeFileDisclosureChallenge, () => { return (utils.matchesEtcPasswdFile(xmlString) || utils.matchesSystemIniFile(xmlString)); });
                res.status(410);
                next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(xmlString, 400) + ' (' + file.originalname + ')'));
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessage.includes('Script execution timed out')) {
                    if (challengeUtils.notSolved(datacache_1.challenges.xxeDosChallenge)) {
                        challengeUtils.solve(datacache_1.challenges.xxeDosChallenge);
                    }
                    res.status(503);
                    next(new Error('Sorry, we are temporarily not available! Please try again later.'));
                }
                else {
                    res.status(410);
                    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + errorMessage + ' (' + file.originalname + ')'));
                }
            }
        }
        else {
            res.status(410);
            next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'));
        }
    }
    next();
}
function handleYamlUpload({ file }, res, next) {
    if ((file?.originalname?.toLowerCase().endsWith('.yml') ?? false) || (file?.originalname?.toLowerCase().endsWith('.yaml') ?? false)) {
        challengeUtils.solveIf(datacache_1.challenges.deprecatedInterfaceChallenge, () => { return true; });
        if (((file?.buffer) != null) && utils.isChallengeEnabled(datacache_1.challenges.deprecatedInterfaceChallenge)) {
            const data = file.buffer.toString();
            try {
                const sandbox = { yaml: js_yaml_1.default, data };
                node_vm_1.default.createContext(sandbox);
                const yamlString = node_vm_1.default.runInContext('JSON.stringify(yaml.load(data))', sandbox, { timeout: 2000 });
                res.status(410);
                next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(yamlString, 400) + ' (' + file.originalname + ')'));
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessage.includes('Invalid string length') || errorMessage.includes('Script execution timed out')) {
                    if (challengeUtils.notSolved(datacache_1.challenges.yamlBombChallenge)) {
                        challengeUtils.solve(datacache_1.challenges.yamlBombChallenge);
                    }
                    res.status(503);
                    next(new Error('Sorry, we are temporarily not available! Please try again later.'));
                }
                else {
                    res.status(410);
                    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + errorMessage + ' (' + file.originalname + ')'));
                }
            }
        }
        else {
            res.status(410);
            next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'));
        }
    }
    res.status(204).end();
}
//# sourceMappingURL=fileUpload.js.map