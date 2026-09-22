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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = require("js-yaml");
const challenges = (0, js_yaml_1.load)(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../data/static/challenges.yml'), 'utf8'));
const en = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../frontend/src/assets/i18n/en.json'), 'utf8'));
void (0, node_test_1.describe)('Challenge Tags', () => {
    void (0, node_test_1.it)('should be present in en.json', () => {
        challenges.forEach((challenge) => {
            if (challenge.tags) {
                challenge.tags.forEach((tag) => {
                    const tagKey = `TAG_${tag.toUpperCase().replace(/\s/g, '_')}`;
                    strict_1.default.notEqual(en[tagKey], undefined, `Challenge "${challenge.name}" uses unsupported tag "${tag}". Only tags listed at https://pwning.owasp-juice.shop/companion-guide/latest/part1/challenges.html#_challenge_tags may be used. Tag Key: ${tagKey}`);
                });
            }
        });
    });
});
//# sourceMappingURL=challengeTag.unit.test.js.map