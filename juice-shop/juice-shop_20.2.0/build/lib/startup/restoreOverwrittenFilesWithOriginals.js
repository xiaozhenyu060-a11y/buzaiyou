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
const node_path_1 = __importDefault(require("node:path"));
const utils = __importStar(require("../utils"));
const logger_1 = __importDefault(require("../logger"));
const node_fs_1 = require("node:fs");
const glob_1 = require("glob");
let restorationPromise = null;
const restoreOverwrittenFilesWithOriginals = async () => {
    if (restorationPromise !== null) {
        return await restorationPromise;
    }
    restorationPromise = (async () => {
        if (process.env.NODE_ENV === 'test' && (0, node_fs_1.existsSync)(node_path_1.default.resolve('i18n/en.json'))) {
            return;
        }
        try {
            (0, node_fs_1.copyFileSync)(node_path_1.default.resolve('data/static/legal.md'), node_path_1.default.resolve('ftp/legal.md'));
            if ((0, node_fs_1.existsSync)(node_path_1.default.resolve('frontend/dist'))) {
                (0, node_fs_1.copyFileSync)(node_path_1.default.resolve('data/static/owasp_promo.vtt'), node_path_1.default.resolve('frontend/dist/frontend/assets/public/videos/owasp_promo.vtt'));
            }
            const files = (0, glob_1.globSync)(node_path_1.default.resolve('data/static/i18n/*.json').replace(/\\/g, '/'));
            for (const filename of files) {
                (0, node_fs_1.copyFileSync)(filename, node_path_1.default.resolve('i18n/', node_path_1.default.basename(filename)));
            }
        }
        catch (err) {
            logger_1.default.warn('Error restoring i18n files: ' + utils.getErrorMessage(err));
        }
    })();
    return await restorationPromise;
};
exports.default = restoreOverwrittenFilesWithOriginals;
//# sourceMappingURL=restoreOverwrittenFilesWithOriginals.js.map