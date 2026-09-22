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
const appConfiguration_1 = require("../../routes/appConfiguration");
void (0, node_test_1.describe)('appConfiguration', () => {
    let req;
    let res;
    void (0, node_test_1.it)('should return configuration object', () => {
        req = {};
        res = { json: node_test_1.mock.fn() };
        (0, appConfiguration_1.retrieveAppConfiguration)()(req, res);
        strict_1.default.equal(res.json.mock.calls.length, 1);
        const returnedConfig = res.json.mock.calls[0].arguments[0].config;
        strict_1.default.ok(returnedConfig.application != null);
    });
    void (0, node_test_1.it)('should not expose chatBot.llmApiUrl', () => {
        req = {};
        res = { json: node_test_1.mock.fn() };
        (0, appConfiguration_1.retrieveAppConfiguration)()(req, res);
        const returnedConfig = res.json.mock.calls[0].arguments[0].config;
        strict_1.default.ok(returnedConfig.application.chatBot != null);
        strict_1.default.ok(!('llmApiUrl' in returnedConfig.application.chatBot));
    });
});
//# sourceMappingURL=appConfiguration.unit.test.js.map