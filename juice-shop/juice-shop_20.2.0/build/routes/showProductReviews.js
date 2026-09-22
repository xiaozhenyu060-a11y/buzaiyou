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
exports.showProductReviews = showProductReviews;
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const security = __importStar(require("../lib/insecurity"));
const db = __importStar(require("../data/mongodb"));
const utils = __importStar(require("../lib/utils"));
// Blocking sleep function as in native MongoDB
// @ts-expect-error FIXME Type safety broken for global object
global.sleep = (time) => {
    // Ensure that users don't accidentally dos their servers for too long
    if (time > 2000) {
        time = 2000;
    }
    const stop = new Date().getTime();
    while (new Date().getTime() < stop + time) {
        ;
    }
};
function showProductReviews() {
    return (req, res, next) => {
        // Truncate id to avoid unintentional RCE
        const id = !utils.isChallengeEnabled(datacache_1.challenges.noSqlCommandChallenge) ? Number(req.params.id) : utils.trunc(req.params.id, 40);
        // Measure how long the query takes, to check if there was a nosql dos attack
        const t0 = new Date().getTime();
        db.reviewsCollection.find({ $where: 'this.product == ' + id }).then((reviews) => {
            const t1 = new Date().getTime();
            challengeUtils.solveIf(datacache_1.challenges.noSqlCommandChallenge, () => { return (t1 - t0) > 2000; });
            const user = security.authenticatedUsers.from(req);
            for (let i = 0; i < reviews.length; i++) {
                if (user === undefined || reviews[i].likedBy.includes(user.data.email)) {
                    reviews[i].liked = true;
                }
            }
            res.json(utils.queryResultToJson(reviews));
        }, () => {
            res.status(400).json({ error: 'Wrong Params' });
        });
    };
}
//# sourceMappingURL=showProductReviews.js.map