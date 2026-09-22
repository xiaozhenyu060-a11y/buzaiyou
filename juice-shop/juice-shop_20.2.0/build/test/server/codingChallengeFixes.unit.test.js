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
const vulnCodeSnippet_1 = require("../../routes/vulnCodeSnippet");
const vulnCodeFixes_1 = require("../../routes/vulnCodeFixes");
const graceful_fs_1 = __importDefault(require("graceful-fs"));
void (0, node_test_1.describe)('codingChallengeFixes', () => {
    let codingChallenges;
    (0, node_test_1.before)(async () => {
        codingChallenges = await (0, vulnCodeSnippet_1.retrieveChallengesWithCodeSnippet)();
    });
    void (0, node_test_1.it)('should have a correct fix for each coding challenge', async () => {
        for (const challenge of codingChallenges) {
            const fixes = (0, vulnCodeFixes_1.readFixes)(challenge);
            strict_1.default.ok(fixes.correct > -1, `Coding challenge ${challenge} does not have a correct fix file`);
        }
    });
    void (0, node_test_1.it)('should have a total of three or more fix options for each coding challenge', async () => {
        for (const challenge of codingChallenges) {
            const fixes = (0, vulnCodeFixes_1.readFixes)(challenge);
            strict_1.default.ok(fixes.fixes.length >= 3, `Coding challenge ${challenge} does not have enough fix option files`);
        }
    });
    void (0, node_test_1.it)('should have an info YAML file for each coding challenge', async () => {
        for (const challenge of codingChallenges) {
            strict_1.default.equal(graceful_fs_1.default.existsSync('./data/static/codefixes/' + challenge + '.info.yml'), true, `Coding challenge ${challenge} does not have an info YAML file`);
        }
    });
});
//# sourceMappingURL=codingChallengeFixes.unit.test.js.map