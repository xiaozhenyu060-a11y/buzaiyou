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
const codingChallenges = __importStar(require("../../lib/codingChallenges"));
void (0, node_test_1.describe)('codingChallenges', () => {
    void (0, node_test_1.it)('should find files with code challenges in the project structure', async () => {
        const matches = await codingChallenges.findFilesWithCodeChallenges(['./lib']);
        strict_1.default.ok(matches.length > 0);
        strict_1.default.ok(matches.some(m => m.path.includes('insecurity.ts')));
    });
    void (0, node_test_1.it)('should log warning and continue if a path does not exist', async () => {
        const matches = await codingChallenges.findFilesWithCodeChallenges(['non-existent-folder']);
        strict_1.default.equal(matches.length, 0);
    });
    void (0, node_test_1.it)('should successfully retrieve coding challenges map', async () => {
        const challenges = await codingChallenges.getCodeChallenges();
        strict_1.default.ok(challenges instanceof Map);
        strict_1.default.ok(challenges.size > 0);
    });
    void (0, node_test_1.it)('BrokenBoundary error should have correct properties', () => {
        const error = new codingChallenges.BrokenBoundary('Test message');
        strict_1.default.equal(error.name, 'BrokenBoundary');
        strict_1.default.equal(error.message, 'Test message');
    });
    void (0, node_test_1.it)('should throw BrokenBoundary error if snippet boundaries are broken', () => {
        const source = '// vuln-code-snippet start challengeKey\n some code\n'; // Missing end
        strict_1.default.throws(() => {
            codingChallenges.getCodingChallengeFromFileContent(source, 'challengeKey');
        }, {
            name: 'BrokenBoundary',
            message: 'Broken code snippet boundaries for: challengeKey'
        });
    });
});
//# sourceMappingURL=codingChallenges.unit.test.js.map