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
const b2bOrder_1 = require("../../routes/b2bOrder");
void (0, node_test_1.describe)('b2bOrder', () => {
    let req;
    let res;
    let next;
    let save;
    (0, node_test_1.beforeEach)(() => {
        req = { body: {} };
        res = { json: node_test_1.mock.fn(), status: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
        save = () => ({
            then() { }
        });
        datacache_1.challenges.rceChallenge = { solved: false, save };
    });
    void (0, node_test_1.it)('infinite loop payload does not succeed but solves "rceChallenge"', { skip: true }, () => {
        req.body.orderLinesData = '(function dos() { while(true); })()';
        (0, b2bOrder_1.b2bOrder)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.rceChallenge.solved, true);
    });
    void (0, node_test_1.it)('timeout after 2 seconds solves "rceOccupyChallenge"', { skip: true }, () => {
        req.body.orderLinesData = '/((a+)+)b/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa")';
        (0, b2bOrder_1.b2bOrder)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.rceOccupyChallenge.solved, true);
    });
    void (0, node_test_1.it)('deserializing JSON as documented in Swagger should not solve "rceChallenge"', () => {
        req.body.orderLinesData = '{"productId": 12,"quantity": 10000,"customerReference": ["PO0000001.2", "SM20180105|042"],"couponCode": "pes[Bh.u*t"}';
        (0, b2bOrder_1.b2bOrder)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.rceChallenge.solved, false);
    });
    void (0, node_test_1.it)('deserializing arbitrary JSON should not solve "rceChallenge"', () => {
        req.body.orderLinesData = '{"hello": "world", "foo": 42, "bar": [false, true]}';
        (0, b2bOrder_1.b2bOrder)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.rceChallenge.solved, false);
    });
    void (0, node_test_1.it)('deserializing broken JSON should not solve "rceChallenge"', () => {
        req.body.orderLinesData = '{ "productId: 28';
        (0, b2bOrder_1.b2bOrder)()(req, res, next);
        strict_1.default.equal(datacache_1.challenges.rceChallenge.solved, false);
    });
});
//# sourceMappingURL=b2bOrder.unit.test.js.map