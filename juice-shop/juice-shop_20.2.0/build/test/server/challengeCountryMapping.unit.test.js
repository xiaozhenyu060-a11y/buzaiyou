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
void (0, node_test_1.describe)('challengeCountryMapping', () => {
    let challenges;
    let countryMapping;
    (0, node_test_1.before)(async () => {
        challenges = await loadYamlFile(node_path_1.default.resolve('data/static/challenges.yml'));
        countryMapping = (await loadYamlFile(node_path_1.default.resolve('config/fbctf.yml')))?.ctf?.countryMapping;
    });
    void (0, node_test_1.it)('should have a country mapping for every challenge', async () => {
        for (const { key } of challenges) {
            strict_1.default.ok(key in countryMapping, `Challenge "${key}" does not have a country mapping.`);
        }
    });
    void (0, node_test_1.it)('should have unique country codes in every mapping', async () => {
        const countryCodeCounts = {};
        for (const key of Object.keys(countryMapping)) {
            const { code } = countryMapping[key];
            if (!Object.prototype.hasOwnProperty.call(countryCodeCounts, code)) {
                countryCodeCounts[code] = 0;
            }
            countryCodeCounts[code]++;
        }
        for (const key of Object.keys(countryCodeCounts)) {
            const count = countryCodeCounts[key];
            strict_1.default.equal(count, 1, `Country "${key}" is used for multiple country mappings.`);
        }
    });
});
//# sourceMappingURL=challengeCountryMapping.unit.test.js.map