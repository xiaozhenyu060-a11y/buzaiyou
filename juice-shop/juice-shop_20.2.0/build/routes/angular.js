"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveAngularClient = serveAngularClient;
const node_path_1 = __importDefault(require("node:path"));
function serveAngularClient() {
    return ({ url }, res, next) => {
        if (!url.startsWith('/api') && !url.startsWith('/rest')) {
            res.sendFile(node_path_1.default.resolve('frontend/dist/frontend/index.html'));
        }
        else {
            next(new Error('Unexpected path: ' + url));
        }
    };
}
//# sourceMappingURL=angular.js.map