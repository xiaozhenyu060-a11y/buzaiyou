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
exports.performRedirect = performRedirect;
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const security = __importStar(require("../lib/insecurity"));
function performRedirect() {
    return ({ query }, res, next) => {
        const toUrl = query.to;
        if (security.isRedirectAllowed(toUrl)) {
            challengeUtils.solveIf(datacache_1.challenges.redirectCryptoCurrencyChallenge, () => { return toUrl === 'https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW' || toUrl === 'https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm' || toUrl === 'https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6'; });
            challengeUtils.solveIf(datacache_1.challenges.redirectChallenge, () => { return isUnintendedRedirect(toUrl); });
            res.redirect(toUrl);
        }
        else {
            res.status(406);
            next(new Error('Unrecognized target URL for redirect: ' + toUrl));
        }
    };
}
function isUnintendedRedirect(toUrl) {
    let unintended = true;
    for (const allowedUrl of security.redirectAllowlist) {
        unintended = unintended && !toUrl.startsWith(allowedUrl);
    }
    return unintended;
}
//# sourceMappingURL=redirect.js.map