"use strict";
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
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = __importDefault(require("config"));
const themes_1 = require("../views/themes/themes");
const utils = __importStar(require("../lib/utils"));
const html_entities_1 = require("html-entities");
const securityQuestion_1 = require("../models/securityQuestion");
const privacyRequests_1 = require("../models/privacyRequests");
const securityAnswer_1 = require("../models/securityAnswer");
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const security = __importStar(require("../lib/insecurity"));
const user_1 = require("../models/user");
const entities = new html_entities_1.AllHtmlEntities();
const router = express_1.default.Router();
router.get('/', (req, res, next) => {
    void (async () => {
        const loggedInUser = security.authenticatedUsers.get(req.cookies.token);
        if (!loggedInUser) {
            next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress));
            return;
        }
        const email = loggedInUser.data.email;
        try {
            const answer = await securityAnswer_1.SecurityAnswerModel.findOne({
                include: [{
                        model: user_1.UserModel,
                        where: { email }
                    }]
            });
            if (answer == null) {
                throw new Error('No answer found!');
            }
            const question = await securityQuestion_1.SecurityQuestionModel.findByPk(answer.SecurityQuestionId);
            if (question == null) {
                throw new Error('No question found!');
            }
            const themeKey = config_1.default.get('application.theme');
            const theme = themes_1.themes[themeKey] || themes_1.themes['bluegrey-lightgreen'];
            res.render('dataErasureForm', {
                userEmail: email,
                securityQuestion: question.question,
                _title_: entities.encode(config_1.default.get('application.name')),
                _favicon_: utils.extractFilename(config_1.default.get('application.favicon')),
                _bgColor_: theme.bgColor,
                _textColor_: theme.textColor,
                _navColor_: theme.navColor,
                _primLight_: theme.primLight,
                _primDark_: theme.primDark,
                _logo_: utils.extractFilename(config_1.default.get('application.logo'))
            });
        }
        catch (error) {
            next(error);
        }
    })();
});
router.post('/', (req, res, next) => {
    void (async () => {
        const loggedInUser = security.authenticatedUsers.get(req.cookies.token);
        if (!loggedInUser) {
            next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress));
            return;
        }
        try {
            await privacyRequests_1.PrivacyRequestModel.create({
                UserId: loggedInUser.data.id,
                deletionRequested: true
            });
            res.clearCookie('token');
            const themeKey = config_1.default.get('application.theme');
            const theme = themes_1.themes[themeKey] || themes_1.themes['bluegrey-lightgreen'];
            const themeVars = {
                _title_: entities.encode(config_1.default.get('application.name')),
                _favicon_: utils.extractFilename(config_1.default.get('application.favicon')),
                _bgColor_: theme.bgColor,
                _textColor_: theme.textColor,
                _navColor_: theme.navColor,
                _primLight_: theme.primLight,
                _primDark_: theme.primDark,
                _logo_: utils.extractFilename(config_1.default.get('application.logo'))
            };
            if (req.body.layout && utils.isChallengeEnabled(datacache_1.challenges.lfrChallenge)) {
                const filePath = node_path_1.default.resolve(req.body.layout).toLowerCase();
                const isForbiddenFile = (filePath.includes('ftp') || filePath.includes('ctf.key') || filePath.includes('encryptionkeys'));
                if (!isForbiddenFile) {
                    res.render('dataErasureResult', {
                        ...req.body,
                        ...themeVars
                    }, (error, html) => {
                        if (!html || error) {
                            next(new Error(error.message));
                        }
                        else {
                            const sendlfrResponse = html.slice(0, 100) + '......';
                            res.send(sendlfrResponse);
                            challengeUtils.solveIf(datacache_1.challenges.lfrChallenge, () => { return true; });
                        }
                    });
                }
                else {
                    next(new Error('File access not allowed'));
                }
            }
            else {
                res.render('dataErasureResult', {
                    ...req.body,
                    ...themeVars
                });
            }
        }
        catch (error) {
            next(error);
        }
    })();
});
exports.default = router;
//# sourceMappingURL=dataErasure.js.map