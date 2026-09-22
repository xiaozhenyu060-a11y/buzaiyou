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
exports.contractExploitListener = contractExploitListener;
const logger_1 = __importDefault(require("../lib/logger"));
const utils = __importStar(require("../lib/utils"));
const datacache_1 = require("../data/datacache");
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const contractABIs_1 = require("../data/static/contractABIs");
const web3WalletAddress = '0x413744D59d31AFDC2889aeE602636177805Bd7b0';
const walletsConnected = new Set();
let isEventListenerCreated = false;
function contractExploitListener() {
    return async (req, res) => {
        const metamaskAddress = req.body.walletAddress;
        walletsConnected.add(metamaskAddress);
        try {
            if (!isEventListenerCreated) {
                const { WebSocketProvider, Contract } = await Promise.resolve().then(() => __importStar(require('ethers')));
                const provider = new WebSocketProvider(`wss://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? ''}`);
                provider.websocket.onerror = (error) => {
                    logger_1.default.error(`WebSocket error (Contract Exploit Listener): ${error.message || error}`);
                    isEventListenerCreated = false;
                };
                const contract = new Contract(web3WalletAddress, contractABIs_1.web3WalletABI, provider);
                void contract.on('ContractExploited', (exploiter) => {
                    if (walletsConnected.has(exploiter)) {
                        walletsConnected.delete(exploiter);
                        challengeUtils.solveIf(datacache_1.challenges.web3WalletChallenge, () => true);
                    }
                });
                isEventListenerCreated = true;
            }
            res.status(200).json({ success: true, message: 'Event Listener Created' });
        }
        catch (error) {
            res.status(500).json(utils.getErrorMessage(error));
        }
    };
}
//# sourceMappingURL=web3Wallet.js.map