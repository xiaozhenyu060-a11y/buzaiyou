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
exports.login = login;
exports.register = register;
const supertest_1 = __importDefault(require("supertest"));
const otplib_1 = require("otplib");
const security = __importStar(require("../../../lib/insecurity"));
const jsonHeader = { 'content-type': 'application/json' };
async function login(app, { email, password, totpSecret }) {
    const loginRes = await (0, supertest_1.default)(app)
        .post('/rest/user/login')
        .set(jsonHeader)
        .send({ email, password });
    if (loginRes.status !== 200 && loginRes.body?.status !== 'totp_token_required') {
        throw new Error(`Failed to login '${email}': ${loginRes.status}`);
    }
    if (loginRes.body.status && loginRes.body.status === 'totp_token_required') {
        if (!totpSecret) {
            throw new Error('login with totp required but no totp secret provided to login function');
        }
        const totpRes = await (0, supertest_1.default)(app)
            .post('/rest/2fa/verify')
            .set(jsonHeader)
            .send({
            tmpToken: loginRes.body.data.tmpToken,
            totpToken: (0, otplib_1.generateSync)({ secret: totpSecret })
        });
        return totpRes.body.authentication;
    }
    return loginRes.body.authentication;
}
async function register(app, { email, password, totpSecret }) {
    const res = await (0, supertest_1.default)(app)
        .post('/api/Users/')
        .set(jsonHeader)
        .send({
        email,
        password,
        passwordRepeat: password,
        securityQuestion: null,
        securityAnswer: null
    });
    if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Failed to register '${email}': ${res.status}`);
    }
    if (totpSecret) {
        const { token } = await login(app, { email, password });
        const setupRes = await (0, supertest_1.default)(app)
            .post('/rest/2fa/setup')
            .set({
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json'
        })
            .send({
            password,
            setupToken: security.authorize({
                secret: totpSecret,
                type: 'totp_setup_secret'
            }),
            initialToken: (0, otplib_1.generateSync)({ secret: totpSecret })
        });
        if (setupRes.status !== 200) {
            throw new Error(`Failed to enable 2fa for user: '${email}'`);
        }
    }
    return res;
}
//# sourceMappingURL=auth.js.map