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
exports.verifyImageCaptcha = void 0;
exports.imageCaptchas = imageCaptchas;
const sequelize_1 = require("sequelize");
const imageCaptcha_1 = require("../models/imageCaptcha");
const security = __importStar(require("../lib/insecurity"));
function imageCaptchas() {
    return async (req, res) => {
        try {
            const { default: svgCaptcha } = await Promise.resolve().then(() => __importStar(require('svg-captcha')));
            const captcha = svgCaptcha.create({ size: 5, noise: 2, color: true });
            const user = security.authenticatedUsers.from(req);
            if (!user) {
                res.status(401).send(res.__('You need to be logged in to request a CAPTCHA.'));
                return;
            }
            const imageCaptcha = {
                image: captcha.data,
                answer: captcha.text,
                UserId: user.data.id
            };
            const imageCaptchaInstance = imageCaptcha_1.ImageCaptchaModel.build(imageCaptcha);
            await imageCaptchaInstance.save();
            res.json(imageCaptcha);
        }
        catch (error) {
            res.status(400).send(res.__('Unable to create CAPTCHA. Please try again.'));
        }
    };
}
const verifyImageCaptcha = () => async (req, res, next) => {
    try {
        const user = security.authenticatedUsers.from(req);
        const UserId = user ? user.data ? user.data.id : undefined : undefined;
        const captchas = await imageCaptcha_1.ImageCaptchaModel.findAll({
            limit: 1,
            where: {
                UserId,
                createdAt: {
                    [sequelize_1.Op.gt]: new Date(Date.now() - 300000)
                }
            },
            order: [['createdAt', 'DESC']]
        });
        if (!captchas[0] || req.body.answer === captchas[0].answer) {
            next();
        }
        else {
            res.status(401).send(res.__('Wrong answer to CAPTCHA. Please try again.'));
        }
    }
    catch (error) {
        res.status(401).send(res.__('Something went wrong while submitting CAPTCHA. Please try again.'));
    }
};
exports.verifyImageCaptcha = verifyImageCaptcha;
//# sourceMappingURL=imageCaptcha.js.map