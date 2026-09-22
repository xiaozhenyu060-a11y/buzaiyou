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
const noUpdate_1 = require("../../lib/noUpdate");
void (0, node_test_1.describe)('noUpdate', () => {
    void (0, node_test_1.it)('should throw an error when trying to update a non-updatable key', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        strict_1.default.equal(model.addHook.mock.calls.length, 1);
        strict_1.default.equal(model.addHook.mock.calls[0].arguments[0], 'beforeValidate');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {
            isNewRecord: false,
            _changed: ['testColumn'],
            rawAttributes: {
                testColumn: { fieldName: 'testColumn' }
            },
            _previousDataValues: {
                testColumn: 'oldValue'
            }
        };
        const options = { validate: true };
        strict_1.default.throws(() => {
            hook(instance, options);
        }, (err) => {
            return err.name === 'SequelizeValidationError' && err.errors[0].path === 'testColumn';
        });
    });
    void (0, node_test_1.it)('should not throw when the non-updatable key is not changed', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {
            isNewRecord: false,
            _changed: ['otherColumn'],
            rawAttributes: {
                otherColumn: { fieldName: 'otherColumn' }
            },
            _previousDataValues: {
                otherColumn: 'oldValue'
            }
        };
        const options = { validate: true };
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
    });
    void (0, node_test_1.it)('should not throw when isNewRecord is true', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {
            isNewRecord: true,
            _changed: ['testColumn']
        };
        const options = { validate: true };
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
    });
    void (0, node_test_1.it)('should not throw when validate option is false', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {};
        const options = { validate: false };
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
    });
    void (0, node_test_1.it)('should not throw when there are no changed keys', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {
            isNewRecord: false,
            _changed: []
        };
        const options = { validate: true };
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
    });
    void (0, node_test_1.it)('should not throw when previous value is null or undefined', () => {
        const model = {
            addHook: node_test_1.mock.fn()
        };
        (0, noUpdate_1.makeKeyNonUpdatable)(model, 'testColumn');
        const hook = model.addHook.mock.calls[0].arguments[1];
        const instance = {
            isNewRecord: false,
            _changed: ['testColumn'],
            rawAttributes: {
                testColumn: { fieldName: 'testColumn' }
            },
            _previousDataValues: {
                testColumn: null
            }
        };
        const options = { validate: true };
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
        instance._previousDataValues.testColumn = undefined;
        strict_1.default.doesNotThrow(() => {
            hook(instance, options);
        });
    });
});
//# sourceMappingURL=noUpdate.unit.test.js.map