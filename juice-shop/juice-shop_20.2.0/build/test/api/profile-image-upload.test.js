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
const node_http_1 = __importDefault(require("node:http"));
const node_fs_1 = __importDefault(require("node:fs"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/profile/image/file', () => {
    void (0, node_test_1.it)('POST profile image file valid for JPG format', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg');
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/file')
            .set('Cookie', `token=${token}`)
            .attach('file', file)
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST profile image file invalid type', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/invalidProfileImageType.docx');
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/file')
            .set('Cookie', `token=${token}`)
            .attach('file', file);
        strict_1.default.equal(res.status, 415);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('Error: Profile image upload does not accept this file type'));
    });
    void (0, node_test_1.it)('POST profile image file forbidden for anonymous user', async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg');
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/file')
            .attach('file', file);
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST profile image file rejected for unrecognizable file content', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/file')
            .set('Cookie', `token=${token}`)
            .attach('file', Buffer.from('not an image, just plain text content'), 'random.bin');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('Error: Illegal file type'));
    });
});
void (0, node_test_1.describe)('/profile/image/url', () => {
    void (0, node_test_1.it)('POST profile image URL valid for image available online', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', 'cataas.com/cat')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST profile image URL redirects even for invalid image URL', async () => {
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', 'https://notanimage.here/100/100')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST profile image URL forbidden for anonymous user', { skip: 'FIXME runs into "socket hang up"' }, async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .field('imageUrl', 'cataas.com/cat');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('Error: Blocked illegal activity'));
    });
    void (0, node_test_1.it)('POST valid image with tampered content length', { skip: 'Fails on CI/CD pipeline' }, async () => {
        const file = node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg');
        const { token } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/file')
            .set('Cookie', `token=${token}`)
            .set('Content-Length', '42')
            .attach('file', file)
            .redirects(0);
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.text.includes('Unexpected end of form'));
    });
});
void (0, node_test_1.describe)('/profile/image/url (with local mock server)', () => {
    let mockServer;
    let mockPort;
    let token;
    let userId;
    (0, node_test_1.before)(async () => {
        const { token: userToken } = await (0, auth_1.login)(app, {
            email: `jim@${config_1.default.get('application.domain')}`,
            password: 'ncc-1701'
        });
        token = userToken;
        userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).data.id;
        const imageBuffer = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, '../files/validProfileImage.jpg'));
        mockServer = node_http_1.default.createServer((req, res) => {
            if (req.url?.includes('non-ok')) {
                res.statusCode = 404;
                res.end();
            }
            else if (req.url?.includes('no-body')) {
                res.statusCode = 204;
                res.end();
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'image/jpeg');
                res.end(imageBuffer);
            }
        });
        await new Promise((resolve) => { mockServer.listen(0, resolve); });
        mockPort = mockServer.address().port;
    });
    (0, node_test_1.after)(async () => {
        await new Promise((resolve, reject) => {
            mockServer.close((err) => { err != null ? reject(err) : resolve(); });
        });
    });
    void (0, node_test_1.it)('POST with non-OK response falls back to storing URL as profile image', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', `http://localhost:${mockPort}/non-ok.jpg`)
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST with empty-body response (204) falls back to storing URL as profile image', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', `http://localhost:${mockPort}/no-body.jpg`)
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('POST with valid response writes file and redirects to profile', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', `http://localhost:${mockPort}/photo.jpg`)
            .redirects(0);
        strict_1.default.equal(res.status, 302);
        strict_1.default.ok(res.headers.location?.endsWith('/profile'));
    });
    void (0, node_test_1.it)('POST with PNG URL extension saves file using PNG extension', async () => {
        await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', `http://localhost:${mockPort}/photo.png`)
            .redirects(0);
        strict_1.default.ok(node_fs_1.default.existsSync(`frontend/dist/frontend/assets/public/images/uploads/${userId}.png`), `Expected file frontend/dist/frontend/assets/public/images/uploads/${userId}.png to exist`);
    });
    void (0, node_test_1.it)('POST with unrecognised URL extension defaults to JPG extension', async () => {
        await (0, supertest_1.default)(app)
            .post('/profile/image/url')
            .set('Cookie', `token=${token}`)
            .field('imageUrl', `http://localhost:${mockPort}/photo.bmp`)
            .redirects(0);
        strict_1.default.ok(node_fs_1.default.existsSync(`frontend/dist/frontend/assets/public/images/uploads/${userId}.jpg`), `Expected file frontend/dist/frontend/assets/public/images/uploads/${userId}.jpg to exist`);
    });
});
//# sourceMappingURL=profile-image-upload.test.js.map