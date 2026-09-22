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
const datacache_1 = require("../../data/datacache");
const redirect_1 = require("../../routes/redirect");
const insecurity_1 = require("../../lib/insecurity");
void (0, node_test_1.describe)('redirect', () => {
    let req;
    let res;
    let next;
    let save;
    (0, node_test_1.beforeEach)(() => {
        req = { query: {} };
        res = { redirect: node_test_1.mock.fn(), status: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
        save = () => ({
            then() { }
        });
    });
    void (0, node_test_1.describe)('should be performed for all allowlisted URLs', () => {
        for (const url of insecurity_1.redirectAllowlist) {
            void (0, node_test_1.it)(url, () => {
                req.query.to = url;
                (0, redirect_1.performRedirect)()(req, res, next);
                strict_1.default.equal(res.redirect.mock.calls.length, 1);
                strict_1.default.equal(res.redirect.mock.calls[0].arguments[0], url);
            });
        }
    });
    void (0, node_test_1.it)('should raise error for URL not on allowlist', () => {
        req.query.to = 'http://kimminich.de';
        (0, redirect_1.performRedirect)()(req, res, next);
        strict_1.default.equal(res.redirect.mock.calls.length, 0);
        strict_1.default.equal(next.mock.calls.length, 1);
        strict_1.default.ok(next.mock.calls[0].arguments[0] instanceof Error);
    });
    void (0, node_test_1.it)('redirecting to https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm should solve the "redirectCryptoCurrencyChallenge"', () => {
        req.query.to = 'https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm';
        datacache_1.challenges.redirectCryptoCurrencyChallenge = { solved: false, save };
        (0, redirect_1.performRedirect)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.redirectCryptoCurrencyChallenge.solved, true);
    });
    void (0, node_test_1.it)('redirecting to https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW should solve the "redirectCryptoCurrencyChallenge"', () => {
        req.query.to = 'https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW';
        datacache_1.challenges.redirectCryptoCurrencyChallenge = { solved: false, save };
        (0, redirect_1.performRedirect)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.redirectCryptoCurrencyChallenge.solved, true);
    });
    void (0, node_test_1.it)('redirecting to https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6 should solve the "redirectCryptoCurrencyChallenge"', () => {
        req.query.to = 'https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6';
        datacache_1.challenges.redirectCryptoCurrencyChallenge = { solved: false, save };
        (0, redirect_1.performRedirect)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.redirectCryptoCurrencyChallenge.solved, true);
    });
    void (0, node_test_1.it)('tricking the allowlist should solve "redirectChallenge"', () => {
        req.query.to = 'http://kimminich.de?to=https://github.com/juice-shop/juice-shop';
        datacache_1.challenges.redirectChallenge = { solved: false, save };
        (0, redirect_1.performRedirect)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.redirectChallenge.solved, true);
    });
});
//# sourceMappingURL=redirect.unit.test.js.map