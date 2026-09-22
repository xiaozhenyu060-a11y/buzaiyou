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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkKeys = checkKeys;
exports.nftUnlocked = nftUnlocked;
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const utils = __importStar(require("../lib/utils"));
const datacache_1 = require("../data/datacache");
function checkKeys() {
    return async (req, res) => {
        try {
            const { HDNodeWallet } = await Promise.resolve().then(() => __importStar(require('ethers')));
            const mnemonic = 'purpose betray marriage blame crunch monitor spin slide donate sport lift clutch';
            const mnemonicWallet = HDNodeWallet.fromPhrase(mnemonic);
            const privateKey = mnemonicWallet.privateKey;
            const publicKey = mnemonicWallet.publicKey;
            const address = mnemonicWallet.address;
            challengeUtils.solveIf(datacache_1.challenges.nftUnlockChallenge, () => {
                return req.body.privateKey === privateKey;
            });
            if (req.body.privateKey === privateKey) {
                res.status(200).json({ success: true, message: 'Challenge successfully solved', status: datacache_1.challenges.nftUnlockChallenge });
            }
            else {
                if (req.body.privateKey === address) {
                    res.status(401).json({ success: false, message: 'Looks like you entered the public address of my ethereum wallet!', status: datacache_1.challenges.nftUnlockChallenge });
                }
                else if (req.body.privateKey === publicKey) {
                    res.status(401).json({ success: false, message: 'Looks like you entered the public key of my ethereum wallet!', status: datacache_1.challenges.nftUnlockChallenge });
                }
                else {
                    res.status(401).json({ success: false, message: 'Looks like you entered a non-Ethereum private key to access me.', status: datacache_1.challenges.nftUnlockChallenge });
                }
            }
        }
        catch (error) {
            res.status(500).json(utils.getErrorMessage(error));
        }
    };
}
function nftUnlocked() {
    return (req, res) => {
        try {
            res.status(200).json({ status: datacache_1.challenges.nftUnlockChallenge.solved });
        }
        catch (error) {
            res.status(500).json(utils.getErrorMessage(error));
        }
    };
}
//# sourceMappingURL=checkKeys.js.map