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
const setup_1 = require("./helpers/setup");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/redirect', () => {
    void (0, node_test_1.it)('GET redirected to https://github.com/juice-shop/juice-shop when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=https://github.com/juice-shop/juice-shop')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to http://shop.spreadshirt.com/juiceshop when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=http://shop.spreadshirt.com/juiceshop')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to http://shop.spreadshirt.de/juiceshop when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=http://shop.spreadshirt.de/juiceshop')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to https://www.stickeryou.com/products/owasp-juice-shop/794 when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=https://www.stickeryou.com/products/owasp-juice-shop/794')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET redirected to https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6 when this URL is passed as "to" parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6')
            .redirects(0);
        strict_1.default.equal(res.status, 302);
    });
    void (0, node_test_1.it)('GET error message with information leakage when calling /redirect without query parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('TypeError'));
        strict_1.default.ok(res.text.includes('of undefined'));
        strict_1.default.ok(res.text.includes('&#39;includes&#39;'));
    });
    void (0, node_test_1.it)('GET error message with information leakage when calling /redirect with unrecognized query parameter', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?x=y');
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('TypeError'));
        strict_1.default.ok(res.text.includes('of undefined'));
        strict_1.default.ok(res.text.includes('&#39;includes&#39;'));
    });
    void (0, node_test_1.it)('GET error message hinting at allowlist validation when calling /redirect with an unrecognized "to" target', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=whatever');
        strict_1.default.equal(res.status, 406);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('Unrecognized target URL for redirect: whatever'));
    });
    void (0, node_test_1.it)('GET redirected to target URL in "to" parameter when a allow-listed URL is part of the query string', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/redirect?to=/score-board?satisfyIndexOf=https://github.com/juice-shop/juice-shop')
            .redirects(1);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes('main.js'));
        strict_1.default.ok(res.text.includes('scripts.js'));
        strict_1.default.ok(res.text.includes('polyfills.js'));
    });
});
//# sourceMappingURL=redirect.test.js.map