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
exports.getDeliveryMethods = getDeliveryMethods;
exports.getDeliveryMethod = getDeliveryMethod;
const delivery_1 = require("../models/delivery");
const security = __importStar(require("../lib/insecurity"));
function getDeliveryMethods() {
    return async (req, res, next) => {
        const methods = await delivery_1.DeliveryModel.findAll();
        if (methods) {
            const sendMethods = [];
            for (const method of methods) {
                sendMethods.push({
                    id: method.id,
                    name: method.name,
                    price: security.isDeluxe(req) ? method.deluxePrice : method.price,
                    eta: method.eta,
                    icon: method.icon
                });
            }
            res.status(200).json({ status: 'success', data: sendMethods });
        }
        else {
            res.status(400).json({ status: 'error' });
        }
    };
}
function getDeliveryMethod() {
    return async (req, res, next) => {
        const method = await delivery_1.DeliveryModel.findOne({ where: { id: req.params.id } });
        if (method != null) {
            const sendMethod = {
                id: method.id,
                name: method.name,
                price: security.isDeluxe(req) ? method.deluxePrice : method.price,
                eta: method.eta,
                icon: method.icon
            };
            res.status(200).json({ status: 'success', data: sendMethod });
        }
        else {
            res.status(400).json({ status: 'error' });
        }
    };
}
//# sourceMappingURL=delivery.js.map