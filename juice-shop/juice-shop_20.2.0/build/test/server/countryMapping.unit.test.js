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
const countryMapping_1 = require("../../routes/countryMapping");
void (0, node_test_1.describe)('countryMapping', () => {
    let req;
    let res;
    (0, node_test_1.beforeEach)(() => {
        req = {};
        res = { send: node_test_1.mock.fn(), status: node_test_1.mock.fn(() => ({ send: node_test_1.mock.fn() })) };
    });
    void (0, node_test_1.it)('should return configured country mappings', () => {
        (0, countryMapping_1.countryMapping)({ get: node_test_1.mock.fn((key) => key === 'ctf.countryMapping' ? 'TEST' : undefined) })(req, res);
        strict_1.default.equal(res.send.mock.calls.length, 1);
        strict_1.default.equal(res.send.mock.calls[0].arguments[0], 'TEST');
    });
    void (0, node_test_1.it)('should return server error when configuration has no country mappings', () => {
        (0, countryMapping_1.countryMapping)({ get: node_test_1.mock.fn((key) => key === 'ctf.countryMapping' ? null : undefined) })(req, res);
        strict_1.default.equal(res.status.mock.calls.length, 1);
        strict_1.default.equal(res.status.mock.calls[0].arguments[0], 500);
    });
    void (0, node_test_1.it)('should return ' + (config_1.default.get('ctf.countryMapping') ? 'no ' : '') + 'server error for active configuration from config/' + process.env.NODE_ENV + '.yml', () => {
        (0, countryMapping_1.countryMapping)()(req, res);
        if (config_1.default.get('ctf.countryMapping')) {
            strict_1.default.equal(res.send.mock.calls.length, 1);
            strict_1.default.deepEqual(res.send.mock.calls[0].arguments[0], config_1.default.get('ctf.countryMapping'));
        }
        else {
            strict_1.default.equal(res.status.mock.calls.length, 1);
            strict_1.default.equal(res.status.mock.calls[0].arguments[0], 500);
        }
    });
});
//# sourceMappingURL=countryMapping.unit.test.js.map