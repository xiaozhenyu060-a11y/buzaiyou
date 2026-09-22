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
const order_1 = require("../../routes/order");
const basket_1 = require("../../models/basket");
const basketitem_1 = require("../../models/basketitem");
const quantity_1 = require("../../models/quantity");
const wallet_1 = require("../../models/wallet");
const delivery_1 = require("../../models/delivery");
const db = __importStar(require("../../data/mongodb"));
const security = __importStar(require("../../lib/insecurity"));
void (0, node_test_1.describe)('order', () => {
    let req;
    let res;
    let next;
    (0, node_test_1.beforeEach)(() => {
        req = { params: { id: '1' }, body: {}, headers: {}, __: node_test_1.mock.fn((s) => s), socket: { remoteAddress: '127.0.0.1' } };
        res = { json: node_test_1.mock.fn(), status: node_test_1.mock.fn(() => res) };
        next = node_test_1.mock.fn();
        // Reset mocks that might have been set globally or on models
        node_test_1.mock.restoreAll();
    });
    void (0, node_test_1.it)('should call next with error if basket does not exist', async () => {
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => null);
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.match(err.message, /Basket with id=1 does not exist/);
    });
    void (0, node_test_1.it)('should call next with error if QuantityModel.findOne fails', async () => {
        const basket = {
            id: 1,
            Products: [{
                    BasketItem: { ProductId: 1, quantity: 1 },
                    price: 10,
                    deluxePrice: 5,
                    name: 'Product 1',
                    id: 1
                }],
            update: node_test_1.mock.fn()
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        const error = new Error('Quantity error');
        node_test_1.mock.method(quantity_1.QuantityModel, 'findOne', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if QuantityModel.update fails', async () => {
        const basket = {
            id: 1,
            Products: [{
                    BasketItem: { ProductId: 1, quantity: 1 },
                    price: 10,
                    deluxePrice: 5,
                    name: 'Product 1',
                    id: 1
                }],
            update: node_test_1.mock.fn()
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'findOne', async () => ({ quantity: 10 }));
        const error = new Error('Quantity update error');
        node_test_1.mock.method(quantity_1.QuantityModel, 'update', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if WalletModel.decrement fails', async () => {
        const basket = {
            id: 1,
            Products: [{
                    BasketItem: { ProductId: 1, quantity: 1 },
                    price: 100,
                    deluxePrice: 100,
                    name: 'Expensive Product',
                    id: 1
                }],
            update: node_test_1.mock.fn()
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'findOne', async () => ({ quantity: 10 }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'update', async () => [1]);
        req.body.UserId = 1;
        req.body.orderDetails = { paymentId: 'wallet' };
        node_test_1.mock.method(wallet_1.WalletModel, 'findOne', async () => ({ balance: 1000 }));
        const error = new Error('Wallet decrement error');
        node_test_1.mock.method(wallet_1.WalletModel, 'decrement', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if WalletModel.increment fails', async () => {
        const basket = {
            id: 1,
            Products: [{
                    BasketItem: { ProductId: 1, quantity: 1 },
                    price: 10,
                    deluxePrice: 5,
                    name: 'Product 1',
                    id: 1
                }],
            update: node_test_1.mock.fn(),
            coupon: null
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'findOne', async () => ({ quantity: 10 }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'update', async () => [1]);
        req.body.UserId = 1;
        const error = new Error('Wallet increment error');
        node_test_1.mock.method(wallet_1.WalletModel, 'increment', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if DeliveryModel.findOne fails', async () => {
        const basket = {
            id: 1,
            Products: [],
            update: node_test_1.mock.fn(),
            coupon: null
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        req.body.orderDetails = { deliveryMethodId: 1 };
        const error = new Error('Delivery error');
        node_test_1.mock.method(delivery_1.DeliveryModel, 'findOne', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if ordersCollection.insert fails', async () => {
        const basket = {
            id: 1,
            Products: [],
            update: node_test_1.mock.fn(),
            coupon: null
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        const error = new Error('Insert error');
        node_test_1.mock.method(db.ordersCollection, 'insert', async () => { throw error; });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should call next with error if BasketItemModel.destroy fails', async () => {
        const basket = {
            id: 1,
            Products: [],
            update: node_test_1.mock.fn(async () => { }),
            coupon: null
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        const error = new Error('Destroy error');
        node_test_1.mock.method(basketitem_1.BasketItemModel, 'destroy', async () => { throw error; });
        node_test_1.mock.method(db.ordersCollection, 'insert', async () => { });
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.equal(err, error);
    });
    void (0, node_test_1.it)('should handle base64 coupon data in calculateApplicableDiscount', async () => {
        const validOn = new Date('Mar 08, 2019 00:00:00 GMT+0100').getTime();
        const couponData = Buffer.from(`WMNSDY2019-${validOn}`).toString('base64');
        req.body.couponData = couponData;
        const basket = {
            id: 1,
            Products: [],
            update: node_test_1.mock.fn(async () => { }),
            coupon: null
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        node_test_1.mock.method(db.ordersCollection, 'insert', async () => { });
        node_test_1.mock.method(basketitem_1.BasketItemModel, 'destroy', async () => { });
        node_test_1.mock.method(wallet_1.WalletModel, 'increment', async () => { });
        const p = new Promise((resolve) => {
            res.json = (data) => { resolve(data); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        await p;
        strict_1.default.ok(true);
    });
    void (0, node_test_1.it)('should call next with error if wallet balance is insufficient', async () => {
        const basket = {
            id: 1,
            Products: [{
                    BasketItem: { ProductId: 1, quantity: 1 },
                    price: 100,
                    deluxePrice: 100,
                    name: 'Expensive Product',
                    id: 1
                }],
            update: node_test_1.mock.fn()
        };
        node_test_1.mock.method(basket_1.BasketModel, 'findOne', async () => basket);
        node_test_1.mock.method(security.authenticatedUsers, 'from', () => ({ data: { email: 'test@juice-sh.op' } }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'findOne', async () => ({ quantity: 10 }));
        node_test_1.mock.method(quantity_1.QuantityModel, 'update', async () => [1]);
        req.body.UserId = 1;
        req.body.orderDetails = { paymentId: 'wallet' };
        node_test_1.mock.method(wallet_1.WalletModel, 'findOne', async () => ({ balance: 10 }));
        const p = new Promise((resolve) => {
            next = (err) => { resolve(err); };
        });
        (0, order_1.placeOrder)()(req, res, next);
        const err = await p;
        strict_1.default.match(err.message, /Insufficient wallet balance/);
    });
});
//# sourceMappingURL=order.unit.test.js.map