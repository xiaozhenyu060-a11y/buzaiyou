"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.createSequelize = createSequelize;
exports.initModels = initModels;
exports.setSequelize = setSequelize;
const address_1 = require("./address");
const basket_1 = require("./basket");
const basketitem_1 = require("./basketitem");
const captcha_1 = require("./captcha");
const card_1 = require("./card");
const challenge_1 = require("./challenge");
const challengeDependency_1 = require("./challengeDependency");
const complaint_1 = require("./complaint");
const delivery_1 = require("./delivery");
const feedback_1 = require("./feedback");
const hint_1 = require("./hint");
const imageCaptcha_1 = require("./imageCaptcha");
const memory_1 = require("./memory");
const privacyRequests_1 = require("./privacyRequests");
const product_1 = require("./product");
const quantity_1 = require("./quantity");
const recycle_1 = require("./recycle");
const relations_1 = require("./relations");
const securityAnswer_1 = require("./securityAnswer");
const securityQuestion_1 = require("./securityQuestion");
const user_1 = require("./user");
const wallet_1 = require("./wallet");
const sequelize_1 = require("sequelize");
let sequelize = createSequelize();
exports.sequelize = sequelize;
function createSequelize(options) {
    return new sequelize_1.Sequelize('database', 'username', 'password', {
        dialect: 'sqlite',
        retry: {
            match: [/SQLITE_BUSY/],
            name: 'query',
            max: 5
        },
        transactionType: sequelize_1.Transaction.TYPES.IMMEDIATE,
        storage: options?.inMemory ? ':memory:' : 'data/juiceshop.sqlite',
        logging: false
    });
}
function initModels(seq) {
    (0, address_1.AddressModelInit)(seq);
    (0, basket_1.BasketModelInit)(seq);
    (0, basketitem_1.BasketItemModelInit)(seq);
    (0, captcha_1.CaptchaModelInit)(seq);
    (0, card_1.CardModelInit)(seq);
    (0, challenge_1.ChallengeModelInit)(seq);
    (0, challengeDependency_1.ChallengeDependencyModelInit)(seq);
    (0, complaint_1.ComplaintModelInit)(seq);
    (0, delivery_1.DeliveryModelInit)(seq);
    (0, feedback_1.FeedbackModelInit)(seq);
    (0, hint_1.HintModelInit)(seq);
    (0, imageCaptcha_1.ImageCaptchaModelInit)(seq);
    (0, memory_1.MemoryModelInit)(seq);
    (0, privacyRequests_1.PrivacyRequestModelInit)(seq);
    (0, product_1.ProductModelInit)(seq);
    (0, quantity_1.QuantityModelInit)(seq);
    (0, recycle_1.RecycleModelInit)(seq);
    (0, securityAnswer_1.SecurityAnswerModelInit)(seq);
    (0, securityQuestion_1.SecurityQuestionModelInit)(seq);
    (0, user_1.UserModelInit)(seq);
    (0, wallet_1.WalletModelInit)(seq);
    (0, relations_1.relationsInit)(seq);
}
function setSequelize(seq) {
    exports.sequelize = sequelize = seq;
}
initModels(sequelize);
//# sourceMappingURL=index.js.map