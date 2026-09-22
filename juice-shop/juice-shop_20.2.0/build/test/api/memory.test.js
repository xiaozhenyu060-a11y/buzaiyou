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
const supertest_1 = __importDefault(require("supertest"));
const config_1 = __importDefault(require("config"));
const node_path_1 = __importDefault(require("node:path"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/memories', () => {
    void (0, node_test_1.it)('GET memories via public API', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/memories');
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('GET memories via a valid authorization token', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .get('/rest/memories')
            .set({ Authorization: 'Bearer ' + token, 'content-type': 'application/json' });
        strict_1.default.equal(res.status, 200);
    });
    void (0, node_test_1.it)('POST new memory is forbidden via public API', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg');
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .attach('image', file, 'Valid Image')
            .field('caption', 'Valid Image');
        strict_1.default.equal(res.status, 401);
    });
    void (0, node_test_1.it)('POST new memory image file invalid type', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/invalidProfileImageType.docx');
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .set('Authorization', 'Bearer ' + token)
            .attach('image', file, 'Valid Image')
            .field('caption', 'Valid Image');
        strict_1.default.equal(res.status, 500);
    });
    void (0, node_test_1.it)('POST new memory image file is not passed - 1', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .set('Authorization', 'Bearer ' + token);
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'File is not passed');
    });
    void (0, node_test_1.it)('POST new memory image file is not passed - 2', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .set('Authorization', 'Bearer ' + token)
            .field('key1', 'value1')
            .field('key2', 'value2');
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.body.error, 'File is not passed');
    });
    void (0, node_test_1.it)('POST new memory with valid for JPG format image', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg');
        const { token } = await (0, auth_1.login)(app, {
            email: 'jim@' + config_1.default.get('application.domain'),
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .set('Authorization', 'Bearer ' + token)
            .attach('image', file, 'Valid Image')
            .field('caption', 'Valid Image');
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.body.data.caption, 'Valid Image');
        strict_1.default.equal(res.body.data.UserId, 2);
    });
    void (0, node_test_1.it)('Should not crash the node-js server when sending invalid content like described in CVE-2022-24434', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/rest/memories')
            .set('Content-Type', 'multipart/form-data; boundary=----WebKitFormBoundaryoo6vortfDzBsDiro')
            .send('------WebKitFormBoundaryoo6vortfDzBsDiro\r\n Content-Disposition: form-data; name="bildbeschreibung"\r\n\r\n\r\n------WebKitFormBoundaryoo6vortfDzBsDiro--');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Error: Malformed part header'));
    });
});
//# sourceMappingURL=memory.test.js.map