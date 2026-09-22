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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBasketItem = addBasketItem;
exports.quantityCheckBeforeBasketItemAddition = quantityCheckBeforeBasketItemAddition;
exports.quantityCheckBeforeBasketItemUpdate = quantityCheckBeforeBasketItemUpdate;
const basketitem_1 = require("../models/basketitem");
const quantity_1 = require("../models/quantity");
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const utils = __importStar(require("../lib/utils"));
const datacache_1 = require("../data/datacache");
const security = __importStar(require("../lib/insecurity"));
function addBasketItem() {
    return async (req, res, next) => {
        const result = utils.parseJsonCustom(req.rawBody);
        const productIds = [];
        const basketIds = [];
        const quantities = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i].key === 'ProductId') {
                productIds.push(result[i].value);
            }
            else if (result[i].key === 'BasketId') {
                basketIds.push(result[i].value);
            }
            else if (result[i].key === 'quantity') {
                quantities.push(result[i].value);
            }
        }
        const user = security.authenticatedUsers.from(req);
        if (user && basketIds[0] && basketIds[0] !== 'undefined' && Number(user.bid) != Number(basketIds[0])) { // eslint-disable-line eqeqeq
            res.status(401).send('{\'error\' : \'Invalid BasketId\'}');
        }
        else {
            const basketItem = {
                ProductId: productIds[productIds.length - 1],
                BasketId: basketIds[basketIds.length - 1],
                quantity: quantities[quantities.length - 1]
            };
            challengeUtils.solveIf(datacache_1.challenges.basketManipulateChallenge, () => { return user && basketItem.BasketId && basketItem.BasketId !== 'undefined' && user.bid != basketItem.BasketId; }); // eslint-disable-line eqeqeq
            const basketItemInstance = basketitem_1.BasketItemModel.build(basketItem);
            try {
                const addedBasketItem = await basketItemInstance.save();
                res.json({ status: 'success', data: addedBasketItem });
            }
            catch (error) {
                next(error);
            }
        }
    };
}
function quantityCheckBeforeBasketItemAddition() {
    return (req, res, next) => {
        void quantityCheck(req, res, next, req.body.ProductId, req.body.quantity).catch((error) => {
            next(error);
        });
    };
}
function quantityCheckBeforeBasketItemUpdate() {
    return async (req, res, next) => {
        try {
            const item = await basketitem_1.BasketItemModel.findOne({ where: { id: req.params.id } });
            const user = security.authenticatedUsers.from(req);
            challengeUtils.solveIf(datacache_1.challenges.basketManipulateChallenge, () => { return user && req.body.BasketId && user.bid != req.body.BasketId; }); // eslint-disable-line eqeqeq
            if (req.body.quantity) {
                if (item == null) {
                    throw new Error('No such item found!');
                }
                void quantityCheck(req, res, next, item.ProductId, req.body.quantity);
            }
            else {
                next();
            }
        }
        catch (error) {
            next(error);
        }
    };
}
async function quantityCheck(req, res, next, id, quantity) {
    const product = await quantity_1.QuantityModel.findOne({ where: { ProductId: id } });
    if (product == null) {
        throw new Error('No such product found!');
    }
    // is product limited per user and order, except if user is deluxe?
    if (!product.limitPerUser || (product.limitPerUser && product.limitPerUser >= quantity) || security.isDeluxe(req)) {
        if (product.quantity >= quantity) { // enough in stock?
            next();
        }
        else {
            res.status(400).json({ error: res.__('We are out of stock! Sorry for the inconvenience.') });
        }
    }
    else {
        res.status(400).json({ error: res.__('You can order only up to {{quantity}} items of this product.', { quantity: product.limitPerUser.toString() }) });
    }
}
//# sourceMappingURL=basketItems.js.map