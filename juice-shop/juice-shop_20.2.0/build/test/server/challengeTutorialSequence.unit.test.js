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
const node_path_1 = __importDefault(require("node:path"));
const util_1 = require("util");
const js_yaml_1 = require("js-yaml");
const readFile = (0, util_1.promisify)(node_fs_1.default.readFile);
const loadYamlFile = async (filename) => {
    const contents = await readFile(filename, { encoding: 'utf8' });
    return (0, js_yaml_1.safeLoad)(contents);
};
void (0, node_test_1.describe)('challengeTutorialSequence', () => {
    let challenges;
    (0, node_test_1.before)(async () => {
        challenges = await loadYamlFile(node_path_1.default.resolve('data/static/challenges.yml'));
    });
    void (0, node_test_1.it)('should have unique tutorial orders', async () => {
        const tutorialOrderCounts = {};
        for (const { tutorial } of challenges) {
            if (tutorial) {
                const order = tutorial.order;
                if (!Object.prototype.hasOwnProperty.call(tutorialOrderCounts, order)) {
                    tutorialOrderCounts[order] = 0;
                }
                tutorialOrderCounts[order]++;
            }
        }
        for (const order of Object.keys(tutorialOrderCounts)) {
            const count = tutorialOrderCounts[order];
            strict_1.default.equal(count, 1, `Tutorial order "${order}" is used for multiple challenges.`);
        }
    });
});
//# sourceMappingURL=challengeTutorialSequence.unit.test.js.map