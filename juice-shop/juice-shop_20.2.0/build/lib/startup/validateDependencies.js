"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const safe_1 = __importDefault(require("colors/safe"));
const utils = __importStar(require("../utils"));
const logger_1 = __importDefault(require("../logger"));
// @ts-expect-error FIXME due to non-existing type definitions for check-dependencies
const check_dependencies_1 = __importDefault(require("check-dependencies"));
const validateDependencies = async ({ packageDir = '.' } = {}) => {
    let dependencies = {};
    try {
        dependencies = await (0, check_dependencies_1.default)({ packageDir, scopeList: ['dependencies'] });
    }
    catch (err) {
        logger_1.default.warn(`Dependencies in ${safe_1.default.bold(packageDir + '/package.json')} could not be checked due to "${utils.getErrorMessage(err)}" error (${safe_1.default.red('ERROR')})`);
    }
    if (dependencies.depsWereOk === true) {
        logger_1.default.info(`All dependencies in ${safe_1.default.bold(packageDir + '/package.json')} are satisfied (${safe_1.default.green('SUCCESS')})`);
        return true;
    }
    else {
        logger_1.default.warn(`Dependencies in ${safe_1.default.bold(packageDir + '/package.json')} are not rightly satisfied (${safe_1.default.red('ERROR')})`);
        for (const err of dependencies.error) {
            logger_1.default.warn(err);
        }
        return false;
    }
};
exports.default = validateDependencies;
//# sourceMappingURL=validateDependencies.js.map