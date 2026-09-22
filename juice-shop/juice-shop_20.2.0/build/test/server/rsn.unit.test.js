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
const node_fs_1 = __importDefault(require("node:fs"));
const rsnUtil_1 = require("../../rsn/rsnUtil");
void (0, node_test_1.describe)('rsnUtil', () => {
    void (0, node_test_1.describe)('filterString', () => {
        void (0, node_test_1.it)('should remove carriage return characters', () => {
            strict_1.default.equal((0, rsnUtil_1.filterString)('line1\r\nline2\r\n'), 'line1\nline2\n');
        });
        void (0, node_test_1.it)('should leave unix line endings intact', () => {
            strict_1.default.equal((0, rsnUtil_1.filterString)('line1\nline2\n'), 'line1\nline2\n');
        });
        void (0, node_test_1.it)('should handle empty string', () => {
            strict_1.default.equal((0, rsnUtil_1.filterString)(''), '');
        });
        void (0, node_test_1.it)('should handle string with only carriage returns', () => {
            strict_1.default.equal((0, rsnUtil_1.filterString)('\r\r\r'), '');
        });
    });
    void (0, node_test_1.describe)('findChangedFiles', () => {
        void (0, node_test_1.it)('should return empty array when no changes', () => {
            const current = {
                'challenge_1.ts': { added: [5, 10], removed: [3] }
            };
            const cached = {
                'challenge_1.ts': { added: [5, 10], removed: [3] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), []);
        });
        void (0, node_test_1.it)('should detect changed added lines', () => {
            const current = {
                'challenge_1.ts': { added: [5, 11], removed: [] }
            };
            const cached = {
                'challenge_1.ts': { added: [5, 10], removed: [] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['challenge_1.ts']);
        });
        void (0, node_test_1.it)('should detect changed removed lines', () => {
            const current = {
                'challenge_1.ts': { added: [], removed: [7] }
            };
            const cached = {
                'challenge_1.ts': { added: [], removed: [8] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['challenge_1.ts']);
        });
        void (0, node_test_1.it)('should detect new files not in cache', () => {
            const current = {
                'newChallenge_1.ts': { added: [], removed: [] }
            };
            const cached = {};
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['newChallenge_1.ts']);
        });
        void (0, node_test_1.it)('should detect length changes in added lines', () => {
            const current = {
                'challenge_1.ts': { added: [5, 10, 15], removed: [] }
            };
            const cached = {
                'challenge_1.ts': { added: [5, 10], removed: [] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['challenge_1.ts']);
        });
        void (0, node_test_1.it)('should detect length changes in removed lines', () => {
            const current = {
                'challenge_1.ts': { added: [], removed: [3, 7] }
            };
            const cached = {
                'challenge_1.ts': { added: [], removed: [3] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['challenge_1.ts']);
        });
        void (0, node_test_1.it)('should return multiple changed files', () => {
            const current = {
                'a_1.ts': { added: [1], removed: [] },
                'b_1.ts': { added: [], removed: [2] },
                'c_1.ts': { added: [], removed: [] }
            };
            const cached = {
                'a_1.ts': { added: [], removed: [] },
                'b_1.ts': { added: [], removed: [] },
                'c_1.ts': { added: [], removed: [] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), ['a_1.ts', 'b_1.ts']);
        });
        void (0, node_test_1.it)('should compare correctly regardless of array order', () => {
            const current = {
                'challenge_1.ts': { added: [10, 5], removed: [7, 3] }
            };
            const cached = {
                'challenge_1.ts': { added: [5, 10], removed: [3, 7] }
            };
            strict_1.default.deepEqual((0, rsnUtil_1.findChangedFiles)(current, cached), []);
        });
    });
    void (0, node_test_1.describe)('getFixExplanation', () => {
        const info = {
            fixes: [
                { id: 1, explanation: 'First fix explanation' },
                { id: 2, explanation: 'Second fix explanation' },
                { id: 3, explanation: 'Third fix explanation' }
            ],
            hints: ['hint1']
        };
        void (0, node_test_1.it)('should return explanation for standard filename', () => {
            strict_1.default.equal((0, rsnUtil_1.getFixExplanation)('challengeName_2.ts', info), 'Second fix explanation');
        });
        void (0, node_test_1.it)('should return explanation for correct fix filename', () => {
            strict_1.default.equal((0, rsnUtil_1.getFixExplanation)('challengeName_1_correct.ts', info), 'First fix explanation');
        });
        void (0, node_test_1.it)('should return null when fix id not found in info', () => {
            strict_1.default.equal((0, rsnUtil_1.getFixExplanation)('challengeName_99.ts', info), null);
        });
        void (0, node_test_1.it)('should return null when info is null', () => {
            strict_1.default.equal((0, rsnUtil_1.getFixExplanation)('challengeName_1.ts', null), null);
        });
        void (0, node_test_1.it)('should return null when filename has no id pattern', () => {
            strict_1.default.equal((0, rsnUtil_1.getFixExplanation)('noIdHere.ts', info), null);
        });
    });
    void (0, node_test_1.describe)('loadChallengeInfo', () => {
        (0, node_test_1.afterEach)(() => {
            node_test_1.mock.restoreAll();
        });
        void (0, node_test_1.it)('should return null when info file does not exist', () => {
            node_test_1.mock.method(node_fs_1.default, 'existsSync', () => false);
            strict_1.default.equal((0, rsnUtil_1.loadChallengeInfo)('nonExistentChallenge'), null);
        });
        void (0, node_test_1.it)('should parse and return challenge info from yml file', () => {
            node_test_1.mock.method(node_fs_1.default, 'existsSync', () => true);
            node_test_1.mock.method(node_fs_1.default, 'readFileSync', () => 'fixes:\n' +
                '  - id: 1\n' +
                '    explanation: "Test explanation"\n' +
                'hints:\n' +
                '  - "Test hint"\n');
            const result = (0, rsnUtil_1.loadChallengeInfo)('testChallenge');
            strict_1.default.deepEqual(result, {
                fixes: [{ id: 1, explanation: 'Test explanation' }],
                hints: ['Test hint']
            });
        });
    });
});
//# sourceMappingURL=rsn.unit.test.js.map