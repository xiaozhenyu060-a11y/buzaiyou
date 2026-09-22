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
void (0, node_test_1.describe)('isDocker', () => {
    let isDocker;
    (0, node_test_1.beforeEach)(() => {
        try {
            const path = require.resolve('../../lib/is-docker');
            delete require.cache[path];
        }
        catch (e) { }
        isDocker = require('../../lib/is-docker').default;
    });
    void (0, node_test_1.it)('should return false if no docker markers are present', (t) => {
        t.mock.method(node_fs_1.default, 'statSync', () => { throw new Error(); });
        t.mock.method(node_fs_1.default, 'readFileSync', () => { throw new Error(); });
        strict_1.default.equal(isDocker(), false);
    });
    void (0, node_test_1.it)('should return true if /.dockerenv exists', (t) => {
        t.mock.method(node_fs_1.default, 'statSync', (path) => {
            if (path === '/.dockerenv')
                return {};
            throw new Error();
        });
        strict_1.default.equal(isDocker(), true);
    });
    void (0, node_test_1.it)('should return true if /proc/self/cgroup contains "docker"', (t) => {
        t.mock.method(node_fs_1.default, 'readFileSync', (path) => {
            if (path === '/proc/self/cgroup')
                return '...docker...';
            throw new Error();
        });
        strict_1.default.equal(isDocker(), true);
    });
    void (0, node_test_1.it)('should return true if /proc/self/mountinfo contains "/docker/containers/"', (t) => {
        t.mock.method(node_fs_1.default, 'readFileSync', (path) => {
            if (path === '/proc/self/mountinfo')
                return '.../docker/containers/...';
            throw new Error();
        });
        strict_1.default.equal(isDocker(), true);
    });
});
//# sourceMappingURL=is-docker.unit.test.js.map