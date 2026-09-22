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
const config_1 = __importDefault(require("config"));
const package_json_1 = require("../../package.json");
const appVersion_1 = require("../../routes/appVersion");
void (0, node_test_1.describe)('appVersion', () => {
    void (0, node_test_1.it)('should ' + config_1.default.get('application.showVersionNumber') ? '' : 'not ' + 'return version specified in package.json', () => {
        const req = {};
        const res = { json: node_test_1.mock.fn() };
        (0, appVersion_1.retrieveAppVersion)()(req, res);
        strict_1.default.deepEqual(res.json.mock.calls[0].arguments[0], { version: config_1.default.get('application.showVersionNumber') ? package_json_1.version : '' });
    });
});
//# sourceMappingURL=appVersion.unit.test.js.map