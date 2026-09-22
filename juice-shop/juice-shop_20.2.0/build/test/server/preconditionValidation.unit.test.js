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
const node_net_1 = __importDefault(require("node:net"));
const semver_1 = __importDefault(require("semver"));
const package_json_1 = require("./../../package.json");
const validatePreconditions_1 = require("../../lib/startup/validatePreconditions");
void (0, node_test_1.describe)('preconditionValidation', () => {
    void (0, node_test_1.describe)('checkIfRunningOnSupportedNodeVersion', () => {
        void (0, node_test_1.it)('should define the supported semver range as 22 - 26', () => {
            strict_1.default.equal(package_json_1.engines.node, '22 - 26');
            strict_1.default.notEqual(semver_1.default.validRange(package_json_1.engines.node), null);
        });
        void (0, node_test_1.it)('should accept a supported version', () => {
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('26.42.1'), true);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('25.8.1'), true);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('24.2.0'), true);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('23.11.1'), true);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('22.16.0'), true);
        });
        void (0, node_test_1.it)('should fail for an unsupported version', () => {
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('21.7.3'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('20.19.2'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('19.9.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('18.20.4'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('17.3.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('16.10.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('15.9.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('14.0.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('13.13.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('12.16.2'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('11.14.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('10.20.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('9.11.2'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('8.12.0'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('7.10.1'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('6.14.4'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('4.9.1'), false);
            strict_1.default.equal((0, validatePreconditions_1.checkIfRunningOnSupportedNodeVersion)('0.12.8'), false);
        });
    });
    void (0, node_test_1.describe)('checkIfPortIsAvailable', () => {
        void (0, node_test_1.it)('should resolve when port 3000 is closed', async () => {
            const success = await (0, validatePreconditions_1.checkIfPortIsAvailable)(3000);
            strict_1.default.equal(success, true);
        });
        void (0, node_test_1.describe)('open a server before running the test', () => {
            const testServer = node_net_1.default.createServer();
            (0, node_test_1.before)(async () => {
                await new Promise((resolve) => { testServer.listen(3000, resolve); });
            });
            void (0, node_test_1.it)('should reject when port 3000 is open', async () => {
                const success = await (0, validatePreconditions_1.checkIfPortIsAvailable)(3000);
                strict_1.default.equal(success, false);
            });
            (0, node_test_1.after)(async () => {
                await new Promise((resolve) => { testServer.close(() => { resolve(); }); });
            });
        });
    });
    void (0, node_test_1.describe)('checkIfEnvironmentVariableExists', () => {
        const originalEnv = process.env.ALCHEMY_API_KEY;
        (0, node_test_1.after)(() => {
            process.env.ALCHEMY_API_KEY = originalEnv;
        });
        void (0, node_test_1.it)('should return true if environment variable is present', () => {
            process.env.ALCHEMY_API_KEY = 'test-key';
            strict_1.default.equal((0, validatePreconditions_1.checkIfEnvironmentVariableExists)('ALCHEMY_API_KEY'), true);
        });
        void (0, node_test_1.it)('should return false if environment variable is not present', () => {
            delete process.env.ALCHEMY_API_KEY;
            strict_1.default.equal((0, validatePreconditions_1.checkIfEnvironmentVariableExists)('ALCHEMY_API_KEY'), false);
        });
        void (0, node_test_1.it)('should return false if a non-existing environment variable is checked', () => {
            strict_1.default.equal((0, validatePreconditions_1.checkIfEnvironmentVariableExists)('NON_EXISTING_VAR'), false);
        });
    });
    void (0, node_test_1.describe)('isOllamaUrl', () => {
        void (0, node_test_1.it)('should detect URL with Ollama default port 11434', () => {
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://localhost:11434/v1'), true);
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://127.0.0.1:11434/v1'), true);
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('https://myserver.example.com:11434/v1'), true);
        });
        void (0, node_test_1.it)('should detect URL with ollama hostname', () => {
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://ollama:11434/v1'), true);
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://ollama/v1'), true);
        });
        void (0, node_test_1.it)('should detect URL with /ollama path prefix', () => {
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://myserver.example.com/ollama/v1'), true);
        });
        void (0, node_test_1.it)('should not flag non-Ollama URLs', () => {
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('http://localhost:8080/v1'), false);
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('https://api.openai.com/v1'), false);
        });
        void (0, node_test_1.it)('should handle invalid URLs gracefully', () => {
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)('not-a-url'), false);
            strict_1.default.equal((0, validatePreconditions_1.isOllamaUrl)(''), false);
        });
    });
    void (0, node_test_1.describe)('checkIfOllamaModelAvailable', () => {
        let fetchStub;
        (0, node_test_1.beforeEach)(() => {
            fetchStub = node_test_1.mock.method(global, 'fetch');
        });
        (0, node_test_1.afterEach)(() => {
            fetchStub.mock.restore();
        });
        void (0, node_test_1.it)('should succeed when model is listed in Ollama response', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ data: [{ id: 'qwen3.5:9b' }, { id: 'llama3:8b' }] }) }));
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should warn when configured model tag does not match pulled model tag', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ data: [{ id: 'qwen3.5:9b-q4' }] }) }));
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should warn when model is not in the available list', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ data: [{ id: 'llama3:8b' }, { id: 'mistral:7b' }] }) }));
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should handle empty model list', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ data: [] }) }));
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should handle non-ok response gracefully', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: false, status: 500 }));
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should handle fetch error gracefully', async () => {
            fetchStub.mock.mockImplementation(async () => { throw new Error('Connection refused'); });
            await (0, validatePreconditions_1.checkIfLlmModelAvailable)('http://localhost:11434/v1');
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
    });
    void (0, node_test_1.describe)('checkIfDomainReachable', () => {
        let fetchStub;
        (0, node_test_1.beforeEach)(() => {
            fetchStub = node_test_1.mock.method(global, 'fetch');
        });
        (0, node_test_1.afterEach)(() => {
            fetchStub.mock.restore();
        });
        void (0, node_test_1.it)('should return true if domain is reachable', async () => {
            fetchStub.mock.mockImplementation(async () => ({ ok: true }));
            const success = await (0, validatePreconditions_1.checkIfDomainReachable)('https://www.alchemy.com/');
            strict_1.default.equal(success, true);
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
        void (0, node_test_1.it)('should return false and log warnings if domain is not reachable', async () => {
            fetchStub.mock.mockImplementation(async () => { throw new Error('Network error'); });
            const success = await (0, validatePreconditions_1.checkIfDomainReachable)('https://www.alchemy.com/');
            strict_1.default.equal(success, false);
            strict_1.default.equal(fetchStub.mock.calls.length, 1);
        });
    });
});
//# sourceMappingURL=preconditionValidation.unit.test.js.map