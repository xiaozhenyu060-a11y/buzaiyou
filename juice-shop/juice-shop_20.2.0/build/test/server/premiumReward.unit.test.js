"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const datacache_1 = require("../../data/datacache");
const premiumReward_1 = require("../../routes/premiumReward");
void (0, node_test_1.describe)('premiumReward', () => {
    let req;
    let res;
    let save;
    (0, node_test_1.beforeEach)(() => {
        res = { sendFile: node_test_1.mock.fn() };
        req = {};
        save = () => ({
            then() { }
        });
    });
    void (0, node_test_1.it)('should serve /frontend/dist/frontend/assets/private/JuiceShop_Wallpaper_1920x1080_VR.jpg', () => {
        (0, premiumReward_1.servePremiumContent)()(req, res);
        strict_1.default.equal(res.sendFile.mock.calls.length, 1);
        strict_1.default.match(res.sendFile.mock.calls[0].arguments[0], /frontend[/\\]dist[/\\]frontend[/\\]assets[/\\]private[/\\]JuiceShop_Wallpaper_1920x1080_VR\.jpg/);
    });
    void (0, node_test_1.it)('should solve "premiumPaywallChallenge"', () => {
        datacache_1.challenges.premiumPaywallChallenge = { solved: false, save };
        (0, premiumReward_1.servePremiumContent)()(req, res);
        strict_1.default.equal(datacache_1.challenges.premiumPaywallChallenge.solved, true);
    });
});
//# sourceMappingURL=premiumReward.unit.test.js.map