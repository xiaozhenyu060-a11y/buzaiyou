"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// CLI script to validate all customization config files against the config schema.
// Example: npm run lint:config
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const safe_1 = __importDefault(require("colors/safe"));
const config_schema_1 = require("../config.schema");
const configDir = node_path_1.default.resolve(__dirname, '../../config');
async function validateFile(file) {
    let configuration;
    try {
        configuration = js_yaml_1.default.load(await (0, promises_1.readFile)(file, 'utf8'));
    }
    catch (error) {
        console.error(safe_1.default.red(`Could not read or parse ${file}: ${error instanceof Error ? error.message : String(error)}`));
        return false;
    }
    const result = config_schema_1.ValidationSchema.safeParse(configuration);
    if (!result.success) {
        console.error(`Config schema validation of ${safe_1.default.bold(file)} failed with ${result.error.issues.length} errors (${safe_1.default.red('ERROR')})`);
        result.error.issues.forEach(issue => {
            const issuePath = issue.path.join('.');
            console.error(`${issuePath}:${safe_1.default.red(` ${issue.message}`)}`);
        });
        return false;
    }
    console.log(`Config schema validation of ${safe_1.default.bold(file)} passed (${safe_1.default.green('SUCCESS')})`);
    return true;
}
async function main() {
    const entries = await (0, promises_1.readdir)(configDir);
    const files = entries.filter(name => name.endsWith('.yml')).sort().map(name => node_path_1.default.join(configDir, name));
    let success = true;
    for (const file of files) {
        success = await validateFile(file) && success;
    }
    if (!success) {
        node_process_1.default.exit(1);
    }
}
main().catch(error => {
    console.error(error);
    node_process_1.default.exit(1);
});
//# sourceMappingURL=lintConfig.js.map