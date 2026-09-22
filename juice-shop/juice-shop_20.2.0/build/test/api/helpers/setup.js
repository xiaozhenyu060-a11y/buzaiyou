"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
const server_1 = require("../../../server");
async function createTestApp() {
    return await (0, server_1.createApp)({ inMemoryDb: true });
}
//# sourceMappingURL=setup.js.map