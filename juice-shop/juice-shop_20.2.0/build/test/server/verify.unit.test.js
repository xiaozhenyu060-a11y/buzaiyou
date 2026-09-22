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
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const config_1 = __importDefault(require("config"));
const datacache_1 = require("../../data/datacache");
const security = __importStar(require("../../lib/insecurity"));
const verify = __importStar(require("../../routes/verify"));
const utils_1 = require("../../lib/utils");
void (0, node_test_1.describe)('verify', () => {
    let req;
    let res;
    let next;
    let save;
    let err;
    (0, node_test_1.beforeEach)(() => {
        req = { body: {}, headers: {}, header: node_test_1.mock.fn(() => undefined) };
        res = { json: node_test_1.mock.fn() };
        next = node_test_1.mock.fn();
        save = () => ({
            then() { }
        });
    });
    void (0, node_test_1.describe)('"forgedFeedbackChallenge"', () => {
        (0, node_test_1.beforeEach)(() => {
            security.authenticatedUsers.put('token12345', {
                data: {
                    id: 42,
                    email: 'test@juice-sh.op'
                }
            });
            datacache_1.challenges.forgedFeedbackChallenge = { solved: false, save };
        });
        void (0, node_test_1.it)('is not solved when an authenticated user passes his own ID when writing feedback', () => {
            req.body.UserId = 42;
            req.headers = { authorization: 'Bearer token12345' };
            verify.forgedFeedbackChallenge()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.forgedFeedbackChallenge.solved, false);
        });
        void (0, node_test_1.it)('is not solved when an authenticated user passes no ID when writing feedback', () => {
            req.body.UserId = undefined;
            req.headers = { authorization: 'Bearer token12345' };
            verify.forgedFeedbackChallenge()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.forgedFeedbackChallenge.solved, false);
        });
        void (0, node_test_1.it)('is solved when an authenticated user passes someone elses ID when writing feedback', () => {
            req.body.UserId = 1;
            req.headers = { authorization: 'Bearer token12345' };
            verify.forgedFeedbackChallenge()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.forgedFeedbackChallenge.solved, true);
        });
        void (0, node_test_1.it)('is solved when an unauthenticated user passes someones ID when writing feedback', () => {
            req.body.UserId = 1;
            req.headers = {};
            verify.forgedFeedbackChallenge()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.forgedFeedbackChallenge.solved, true);
        });
    });
    void (0, node_test_1.describe)('accessControlChallenges', () => {
        void (0, node_test_1.it)('"scoreBoardChallenge" is solved when the 1px.png transpixel is requested', () => {
            datacache_1.challenges.scoreBoardChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/public/images/padding/1px.png';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.scoreBoardChallenge.solved, true);
        });
        void (0, node_test_1.it)('"adminSectionChallenge" is solved when the 19px.png transpixel is requested', () => {
            datacache_1.challenges.adminSectionChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/public/images/padding/19px.png';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.adminSectionChallenge.solved, true);
        });
        void (0, node_test_1.it)('"tokenSaleChallenge" is solved when the 56px.png transpixel is requested', () => {
            datacache_1.challenges.tokenSaleChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/public/images/padding/56px.png';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.tokenSaleChallenge.solved, true);
        });
        void (0, node_test_1.it)('"extraLanguageChallenge" is solved when the Klingon translation file is requested', () => {
            datacache_1.challenges.extraLanguageChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/public/i18n/tlh_AA.json';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.extraLanguageChallenge.solved, true);
        });
        void (0, node_test_1.it)('"retrieveBlueprintChallenge" is solved when the blueprint file is requested', () => {
            datacache_1.challenges.retrieveBlueprintChallenge = { solved: false, save };
            (0, datacache_1.setRetrieveBlueprintChallengeFile)('test.dxf');
            req.url = 'http://juice-sh.op/public/images/products/test.dxf';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.retrieveBlueprintChallenge.solved, true);
        });
        void (0, node_test_1.it)('"missingEncodingChallenge" is solved when the crazy cat photo is requested', () => {
            datacache_1.challenges.missingEncodingChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/public/images/uploads/%E1%93%9A%E1%98%8F%E1%97%A2-%23zatschi-%23whoneedsfourlegs-1572600969477.jpg';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.missingEncodingChallenge.solved, true);
        });
        void (0, node_test_1.it)('"accessLogDisclosureChallenge" is solved when any server access log file is requested', () => {
            datacache_1.challenges.accessLogDisclosureChallenge = { solved: false, save };
            req.url = 'http://juice-sh.op/support/logs/access.log.2019-01-15';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.accessLogDisclosureChallenge.solved, true);
        });
        void (0, node_test_1.it)('"misplacedIacFiles" is solved when a Terraform .tf file under /infrastructure is requested', () => {
            datacache_1.challenges.misplacedIacFiles = { solved: false, save };
            req.url = 'http://juice-sh.op/infrastructure/terraform/main.tf';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.misplacedIacFiles.solved, true);
        });
        void (0, node_test_1.it)('"misplacedIacFiles" is solved when a Dockerfile under /infrastructure is requested', () => {
            datacache_1.challenges.misplacedIacFiles = { solved: false, save };
            req.url = 'http://juice-sh.op/infrastructure/Dockerfile';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.misplacedIacFiles.solved, true);
        });
        void (0, node_test_1.it)('"misplacedIacFiles" is solved when a docker-compose.yml under /infrastructure is requested', () => {
            datacache_1.challenges.misplacedIacFiles = { solved: false, save };
            req.url = 'http://juice-sh.op/infrastructure/docker-compose.yml';
            verify.accessControlChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.misplacedIacFiles.solved, true);
        });
    });
    void (0, node_test_1.describe)('"errorHandlingChallenge"', () => {
        (0, node_test_1.beforeEach)(() => {
            datacache_1.challenges.errorHandlingChallenge = { solved: false, save };
        });
        void (0, node_test_1.it)('is solved when an error occurs on a response with OK 200 status code', () => {
            res.statusCode = 200;
            err = new Error();
            verify.errorHandlingChallenge()(err, req, res, next);
            strict_1.default.equal(datacache_1.challenges.errorHandlingChallenge.solved, true);
        });
        void (0, node_test_1.describe)('is solved when an error occurs on a response with error', () => {
            const httpStatus = [402, 403, 404, 500];
            httpStatus.forEach(statusCode => {
                void (0, node_test_1.it)(`${statusCode} status code`, () => {
                    res.statusCode = statusCode;
                    err = new Error();
                    verify.errorHandlingChallenge()(err, req, res, next);
                    strict_1.default.equal(datacache_1.challenges.errorHandlingChallenge.solved, true);
                });
            });
        });
        void (0, node_test_1.it)('is not solved when no error occurs on a response with OK 200 status code', () => {
            res.statusCode = 200;
            err = undefined;
            verify.errorHandlingChallenge()(err, req, res, next);
            strict_1.default.equal(datacache_1.challenges.errorHandlingChallenge.solved, false);
        });
        void (0, node_test_1.describe)('is not solved when no error occurs on a response with error', () => {
            const httpStatus = [401, 402, 404, 500];
            httpStatus.forEach(statusCode => {
                void (0, node_test_1.it)(`${statusCode} status code`, () => {
                    res.statusCode = statusCode;
                    err = undefined;
                    verify.errorHandlingChallenge()(err, req, res, next);
                    strict_1.default.equal(datacache_1.challenges.errorHandlingChallenge.solved, false);
                });
            });
        });
        void (0, node_test_1.it)('should pass occurred error on to next route', () => {
            res.statusCode = 500;
            err = new Error();
            verify.errorHandlingChallenge()(err, req, res, next);
            strict_1.default.equal(next.mock.calls.length, 1);
            strict_1.default.equal(next.mock.calls[0].arguments[0], err);
        });
    });
    void (0, node_test_1.describe)('databaseRelatedChallenges', () => {
        void (0, node_test_1.describe)('"changeProductChallenge"', () => {
            (0, node_test_1.beforeEach)(() => {
                datacache_1.challenges.changeProductChallenge = { solved: false, save };
                datacache_1.products.osaft = { reload() { return { then(cb) { cb(); } }; } };
            });
            void (0, node_test_1.it)(`is solved when the link in the O-Saft product goes to ${config_1.default.get('challenges.overwriteUrlForProductTamperingChallenge')}`, () => {
                datacache_1.products.osaft.description = `O-Saft, yeah! <a href="${config_1.default.get('challenges.overwriteUrlForProductTamperingChallenge')}" target="_blank">More...</a>`;
                verify.databaseRelatedChallenges()(req, res, next);
                strict_1.default.equal(datacache_1.challenges.changeProductChallenge.solved, true);
            });
            void (0, node_test_1.it)('is not solved when the link in the O-Saft product is changed to an arbitrary URL', () => {
                datacache_1.products.osaft.description = 'O-Saft, nooo! <a href="http://arbitrary.url" target="_blank">More...</a>';
                verify.databaseRelatedChallenges()(req, res, next);
                strict_1.default.equal(datacache_1.challenges.changeProductChallenge.solved, false);
            });
            void (0, node_test_1.it)('is not solved when the link in the O-Saft product remained unchanged', () => {
                let urlForProductTamperingChallenge = null;
                for (const product of config_1.default.get('products')) {
                    if (product.urlForProductTamperingChallenge !== undefined) {
                        urlForProductTamperingChallenge = product.urlForProductTamperingChallenge;
                        break;
                    }
                }
                datacache_1.products.osaft.description = `Vanilla O-Saft! <a href="${urlForProductTamperingChallenge}" target="_blank">More...</a>`;
                verify.databaseRelatedChallenges()(req, res, next);
                strict_1.default.equal(datacache_1.challenges.changeProductChallenge.solved, false);
            });
        });
    });
    void (0, node_test_1.describe)('jwtChallenges', () => {
        (0, node_test_1.beforeEach)(() => {
            datacache_1.challenges.jwtUnsignedChallenge = { solved: false, save };
            datacache_1.challenges.jwtForgedChallenge = { solved: false, save, disabledEnv: 'Windows' };
        });
        void (0, node_test_1.it)('"jwtUnsignedChallenge" is solved when forged unsigned token has email jwtn3d@juice-sh.op in the payload', () => {
            req.headers = { authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJkYXRhIjp7ImVtYWlsIjoiand0bjNkQGp1aWNlLXNoLm9wIn0sImlhdCI6MTUwODYzOTYxMiwiZXhwIjo5OTk5OTk5OTk5fQ.' };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtUnsignedChallenge.solved, true);
        });
        void (0, node_test_1.it)('"jwtUnsignedChallenge" is solved when forged unsigned token has string "jwtn3d@" in the payload', () => {
            req.headers = { authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJkYXRhIjp7ImVtYWlsIjoiand0bjNkQCJ9LCJpYXQiOjE1MDg2Mzk2MTIsImV4cCI6OTk5OTk5OTk5OX0.' };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtUnsignedChallenge.solved, true);
        });
        void (0, node_test_1.it)('"jwtUnsignedChallenge" is not solved via regularly signed token even with email jwtn3d@juice-sh.op in the payload', () => {
            const token = security.authorize({ data: { email: 'jwtn3d@juice-sh.op' } });
            req.headers = { authorization: `Bearer ${token}` };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtUnsignedChallenge.solved, false);
        });
        void (0, node_test_1.it)('"jwtForgedChallenge" is solved when forged token HMAC-signed with public RSA-key has email rsa_lord@juice-sh.op in the payload', { skip: (0, utils_1.isWindows)() ? 'not supported on Windows' : false }, () => {
            req.headers = { authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkYXRhIjp7ImVtYWlsIjoicnNhX2xvcmRAanVpY2Utc2gub3AifSwiaWF0IjoxNTgyMjIxNTc1fQ.ycFwtqh4ht4Pq9K5rhiPPY256F9YCTIecd4FHFuSEAg' };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtForgedChallenge.solved, true);
        });
        void (0, node_test_1.it)('"jwtForgedChallenge" is solved when forged token HMAC-signed with public RSA-key has string "rsa_lord@" in the payload', { skip: (0, utils_1.isWindows)() ? 'not supported on Windows' : false }, () => {
            req.headers = { authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkYXRhIjp7ImVtYWlsIjoicnNhX2xvcmRAIn0sImlhdCI6MTU4MjIyMTY3NX0.50f6VAIQk2Uzpf3sgH-1JVrrTuwudonm2DKn2ec7Tg8' };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtForgedChallenge.solved, true);
        });
        void (0, node_test_1.it)('"jwtForgedChallenge" is not solved when token regularly signed with private RSA-key has email rsa_lord@juice-sh.op in the payload', { skip: (0, utils_1.isWindows)() ? 'not supported on Windows' : false }, () => {
            const token = security.authorize({ data: { email: 'rsa_lord@juice-sh.op' } });
            req.headers = { authorization: `Bearer ${token}` };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.jwtForgedChallenge.solved, false);
        });
        void (0, node_test_1.it)('"iacLeakedKeyChallenge" is solved when RS256-signed token has email cloud-admin@juice-sh.op in the payload', () => {
            datacache_1.challenges.iacLeakedKeyChallenge = { solved: false, save };
            const token = security.authorize({ data: { email: 'cloud-admin@juice-sh.op' } });
            req.headers = { authorization: `Bearer ${token}` };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.iacLeakedKeyChallenge.solved, true);
        });
        void (0, node_test_1.it)('"iacLeakedKeyChallenge" is solved when RS256-signed token has string "cloud-admin@" in the payload', () => {
            datacache_1.challenges.iacLeakedKeyChallenge = { solved: false, save };
            const token = security.authorize({ data: { email: 'cloud-admin@' } });
            req.headers = { authorization: `Bearer ${token}` };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.iacLeakedKeyChallenge.solved, true);
        });
        void (0, node_test_1.it)('"iacLeakedKeyChallenge" is not solved when token has wrong email', () => {
            datacache_1.challenges.iacLeakedKeyChallenge = { solved: false, save };
            const token = security.authorize({ data: { email: 'admin@juice-sh.op' } });
            req.headers = { authorization: `Bearer ${token}` };
            verify.jwtChallenges()(req, res, next);
            strict_1.default.equal(datacache_1.challenges.iacLeakedKeyChallenge.solved, false);
        });
    });
    void (0, node_test_1.describe)('checkSystemPromptSimilarity', () => {
        void (0, node_test_1.it)('should return true if similarity is above threshold', () => {
            const s1 = 'This is a test';
            const s2 = 'This is a test';
            strict_1.default.ok(verify.checkSystemPromptSimilarity(s1, s2));
        });
        void (0, node_test_1.it)('should return false if similarity is below threshold', () => {
            const s1 = 'This is a test';
            const s2 = 'Something completely different';
            strict_1.default.ok(!verify.checkSystemPromptSimilarity(s1, s2, 0.9));
        });
    });
});
//# sourceMappingURL=verify.unit.test.js.map