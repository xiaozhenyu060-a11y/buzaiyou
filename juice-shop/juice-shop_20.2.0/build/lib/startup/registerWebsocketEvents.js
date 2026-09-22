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
const config_1 = __importDefault(require("config"));
const socket_io_1 = require("socket.io");
const datacache_1 = require("../../data/datacache");
const challengeUtils = __importStar(require("../challengeUtils"));
const security = __importStar(require("../insecurity"));
let firstConnectedSocket = null;
const globalWithSocketIO = global;
const registerWebsocketEvents = (server) => {
    const io = new socket_io_1.Server(server, { cors: { origin: 'http://localhost:4200' } });
    globalWithSocketIO.io = io;
    io.on('connection', (socket) => {
        if (firstConnectedSocket === null) {
            socket.emit('server started');
            firstConnectedSocket = socket.id;
        }
        datacache_1.notifications.forEach((notification) => {
            socket.emit('challenge solved', notification);
        });
        socket.on('notification received', (data) => {
            const i = datacache_1.notifications.findIndex(({ flag }) => flag === data);
            if (i > -1) {
                datacache_1.notifications.splice(i, 1);
            }
        });
        socket.on('verifyLocalXssChallenge', (data) => {
            challengeUtils.solveIf(datacache_1.challenges.localXssChallenge, () => { return data?.includes('<iframe src="javascript:alert(`xss`)">') ?? false; });
            challengeUtils.solveIf(datacache_1.challenges.xssBonusChallenge, () => { return data?.includes(config_1.default.get('challenges.xssBonusPayload')) ?? false; });
        });
        socket.on('verifySvgInjectionChallenge', (data) => {
            challengeUtils.solveIf(datacache_1.challenges.svgInjectionChallenge, () => { return data?.match(/.*\.\.\/\.\.\/\.\.[\w/-]*?\/redirect\?to=https?:\/\/cataas.com\/cat.*/) && security.isRedirectAllowed(data); });
        });
        socket.on('verifyCloseNotificationsChallenge', (data) => {
            challengeUtils.solveIf(datacache_1.challenges.closeNotificationsChallenge, () => { return Array.isArray(data) && data.length > 1; });
        });
    });
};
exports.default = registerWebsocketEvents;
//# sourceMappingURL=registerWebsocketEvents.js.map