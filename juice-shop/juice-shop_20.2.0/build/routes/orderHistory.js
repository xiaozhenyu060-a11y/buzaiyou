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
exports.orderHistory = orderHistory;
exports.allOrders = allOrders;
exports.toggleDeliveryStatus = toggleDeliveryStatus;
const mongodb_1 = require("../data/mongodb");
const security = __importStar(require("../lib/insecurity"));
function orderHistory() {
    return async (req, res, next) => {
        const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''));
        if (loggedInUser?.data?.email && loggedInUser.data.id) {
            const email = loggedInUser.data.email;
            const updatedEmail = email.replace(/[aeiou]/gi, '*');
            const order = await mongodb_1.ordersCollection.find({ email: updatedEmail });
            res.status(200).json({ status: 'success', data: order });
        }
        else {
            next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress));
        }
    };
}
function allOrders() {
    return async (req, res, next) => {
        const order = await mongodb_1.ordersCollection.find();
        res.status(200).json({ status: 'success', data: order.reverse() });
    };
}
function toggleDeliveryStatus() {
    return async (req, res, next) => {
        const deliveryStatus = !req.body.deliveryStatus;
        const eta = deliveryStatus ? '0' : '1';
        await mongodb_1.ordersCollection.update({ _id: req.params.id }, { $set: { delivered: deliveryStatus, eta } });
        res.status(200).json({ status: 'success' });
    };
}
//# sourceMappingURL=orderHistory.js.map