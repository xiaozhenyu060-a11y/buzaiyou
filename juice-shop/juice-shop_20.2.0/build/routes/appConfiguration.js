"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveAppConfiguration = retrieveAppConfiguration;
const config_1 = __importDefault(require("config"));
function retrieveAppConfiguration() {
    return (_req, res) => {
        const safeConfig = structuredClone(config_1.default.util.toObject(config_1.default));
        if (safeConfig.application?.chatBot) {
            delete safeConfig.application.chatBot.llmApiUrl;
        }
        res.json({ config: safeConfig });
    };
}
//# sourceMappingURL=appConfiguration.js.map