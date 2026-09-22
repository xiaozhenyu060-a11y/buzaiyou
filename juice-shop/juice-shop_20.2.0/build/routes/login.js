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
exports.login = login;
const config_1 = __importDefault(require("config"));
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const basket_1 = require("../models/basket");
const security = __importStar(require("../lib/insecurity"));
const user_1 = require("../models/user");
const models = __importStar(require("../models/index"));
const utils = __importStar(require("../lib/utils"));
// vuln-code-snippet start loginAdminChallenge loginBenderChallenge loginJimChallenge
function login() {
    function afterLogin(user, res, next) {
        verifyPostLoginChallenges(user); // vuln-code-snippet hide-line
        basket_1.BasketModel.findOrCreate({ where: { UserId: user.id } })
            .then(([basket]) => {
            const authenticatedUser = { data: user, bid: basket.id }; // keep track of original basket
            const token = security.authorize(authenticatedUser);
            security.authenticatedUsers.put(token, authenticatedUser);
            res.json({ authentication: { token, bid: basket.id, umail: user.email } });
        }).catch((error) => {
            next(error);
        });
    }
    return (req, res, next) => {
        verifyPreLoginChallenges(req); // vuln-code-snippet hide-line
        models.sequelize.query(`SELECT * FROM Users WHERE email = '${req.body.email || ''}' AND password = '${security.hash(req.body.password || '')}' AND deletedAt IS NULL`, { model: user_1.UserModel, plain: true }) // vuln-code-snippet vuln-line loginAdminChallenge loginBenderChallenge loginJimChallenge
            .then((authenticatedUser) => {
            const user = utils.queryResultToJson(authenticatedUser);
            if (user.data?.id && user.data.totpSecret !== '') {
                res.status(401).json({
                    status: 'totp_token_required',
                    data: {
                        tmpToken: security.authorize({
                            userId: user.data.id,
                            type: 'password_valid_needs_second_factor_token'
                        })
                    }
                });
            }
            else if (user.data?.id) {
                afterLogin(user.data, res, next);
            }
            else {
                res.status(401).send(res.__('Invalid email or password.'));
            }
        }).catch((error) => {
            next(error);
        });
    };
    // vuln-code-snippet end loginAdminChallenge loginBenderChallenge loginJimChallenge
    function verifyPreLoginChallenges(req) {
        challengeUtils.solveIf(datacache_1.challenges.weakPasswordChallenge, () => { return req.body.email === 'admin@' + config_1.default.get('application.domain') && req.body.password === 'admin123'; });
        challengeUtils.solveIf(datacache_1.challenges.loginSupportChallenge, () => { return req.body.email === 'support@' + config_1.default.get('application.domain') && req.body.password === 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P'; });
        challengeUtils.solveIf(datacache_1.challenges.loginRapperChallenge, () => { return req.body.email === 'mc.safesearch@' + config_1.default.get('application.domain') && req.body.password === 'Mr. N00dles'; });
        challengeUtils.solveIf(datacache_1.challenges.loginAmyChallenge, () => { return req.body.email === 'amy@' + config_1.default.get('application.domain') && req.body.password === 'K1f.....................'; });
        challengeUtils.solveIf(datacache_1.challenges.dlpPasswordSprayingChallenge, () => { return req.body.email === 'J12934@' + config_1.default.get('application.domain') && req.body.password === '0Y8rMnww$*9VFYE§59-!Fg1L6t&6lB'; });
        challengeUtils.solveIf(datacache_1.challenges.oauthUserPasswordChallenge, () => { return req.body.email === 'bjoern.kimminich@gmail.com' && req.body.password === 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI='; });
        challengeUtils.solveIf(datacache_1.challenges.exposedCredentialsChallenge, () => { return req.body.email === 'testing@' + config_1.default.get('application.domain') && req.body.password === 'IamUsedForTesting'; });
    }
    function verifyPostLoginChallenges(user) {
        challengeUtils.solveIf(datacache_1.challenges.loginAdminChallenge, () => { return user.id === datacache_1.users.admin.id; });
        challengeUtils.solveIf(datacache_1.challenges.loginJimChallenge, () => { return user.id === datacache_1.users.jim.id; });
        challengeUtils.solveIf(datacache_1.challenges.loginBenderChallenge, () => { return user.id === datacache_1.users.bender.id; });
        challengeUtils.solveIf(datacache_1.challenges.ghostLoginChallenge, () => { return user.id === datacache_1.users.chris.id; });
        if (challengeUtils.notSolved(datacache_1.challenges.ephemeralAccountantChallenge) && user.email === 'acc0unt4nt@' + config_1.default.get('application.domain') && user.role === 'accounting') {
            user_1.UserModel.count({ where: { email: 'acc0unt4nt@' + config_1.default.get('application.domain') } }).then((count) => {
                if (count === 0) {
                    challengeUtils.solve(datacache_1.challenges.ephemeralAccountantChallenge);
                }
            }).catch(() => {
                throw new Error('Unable to verify challenges! Try again');
            });
        }
    }
}
//# sourceMappingURL=login.js.map