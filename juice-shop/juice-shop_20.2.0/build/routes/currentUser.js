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
exports.retrieveLoggedInUser = retrieveLoggedInUser;
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const security = __importStar(require("../lib/insecurity"));
function retrieveLoggedInUser() {
    return (req, res) => {
        let user;
        let response;
        const emptyUser = { id: undefined, email: undefined, lastLoginIp: undefined, profileImage: undefined };
        try {
            if (security.verify(req.cookies.token)) {
                user = security.authenticatedUsers.get(req.cookies.token);
                // Parse the fields parameter into an array, splitting by comma.
                // If not provided, both these variables will be undefined.
                const fieldsParam = req.query?.fields;
                const requestedFields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : [];
                let baseUser = {};
                if (requestedFields.length > 0) {
                    // When fields are specified, return only those fields
                    for (const field of requestedFields) {
                        if (user?.data[field] !== undefined) {
                            baseUser[field] = user?.data[field];
                        }
                    }
                }
                else {
                    // If no fields parameter, return standard fields (not password field)
                    baseUser = {
                        id: user?.data?.id,
                        email: user?.data?.email,
                        lastLoginIp: user?.data?.lastLoginIp,
                        profileImage: user?.data?.profileImage
                    };
                }
                response = { user: baseUser };
            }
            else {
                response = { user: emptyUser };
            }
        }
        catch (err) {
            response = { user: emptyUser };
        }
        // Solve passwordHashLeakChallenge when password field is included in response
        challengeUtils.solveIf(datacache_1.challenges.passwordHashLeakChallenge, () => response?.user?.password);
        if (req.query.callback === undefined) {
            res.json(response);
        }
        else {
            challengeUtils.solveIf(datacache_1.challenges.emailLeakChallenge, () => { return true; });
            res.jsonp(response);
        }
    };
}
//# sourceMappingURL=currentUser.js.map