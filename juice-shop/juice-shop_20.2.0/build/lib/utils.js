"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.matchesEtcPasswdFile = exports.matchesSystemIniFile = exports.getErrorMessage = exports.toSimpleIpAddress = exports.parseJsonCustom = exports.randomHexString = exports.jwtFrom = exports.downloadToFile = exports.extractFilename = exports.toISO8601 = exports.toMMMYY = exports.ctfFlag = exports.version = exports.trunc = exports.unquote = exports.containsOrEscaped = exports.containsEscaped = exports.isUrl = exports.queryResultToJson = exports.isWindows = exports.isDocker = void 0;
exports.getChallengeEnablementStatus = getChallengeEnablementStatus;
exports.isChallengeEnabled = isChallengeEnabled;
exports.diceCoefficient = diceCoefficient;
const package_json_1 = __importDefault(require("../package.json"));
const node_fs_1 = __importDefault(require("node:fs"));
const logger_1 = __importDefault(require("./logger"));
const config_1 = __importDefault(require("config"));
const download_1 = __importDefault(require("download"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const clarinet_1 = __importDefault(require("clarinet"));
const is_heroku_1 = __importDefault(require("./is-heroku"));
const is_docker_1 = __importDefault(require("./is-docker"));
const is_windows_1 = __importDefault(require("./is-windows"));
var is_docker_2 = require("./is-docker");
Object.defineProperty(exports, "isDocker", { enumerable: true, get: function () { return __importDefault(is_docker_2).default; } });
var is_windows_2 = require("./is-windows");
Object.defineProperty(exports, "isWindows", { enumerable: true, get: function () { return __importDefault(is_windows_2).default; } });
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const queryResultToJson = (data, status = 'success') => {
    return {
        status,
        data
    };
};
exports.queryResultToJson = queryResultToJson;
const isUrl = (url) => {
    return url.startsWith('http');
};
exports.isUrl = isUrl;
const containsEscaped = function (str, element) {
    return str ? str.includes(element.replace(/"/g, '\\"')) : false;
};
exports.containsEscaped = containsEscaped;
const containsOrEscaped = function (str, element) {
    return (str ? str.includes(element) : false) || (0, exports.containsEscaped)(str, element);
};
exports.containsOrEscaped = containsOrEscaped;
const unquote = function (str) {
    if (str && str.startsWith('"') && str.endsWith('"')) {
        return str.substring(1, str.length - 1);
    }
    else {
        return str;
    }
};
exports.unquote = unquote;
const trunc = function (str, length) {
    str = str.replace(/(\r\n|\n|\r)/gm, '');
    return (str.length > length) ? str.substr(0, length - 1) + '...' : str;
};
exports.trunc = trunc;
const version = (module) => {
    if (module) {
        // @ts-expect-error FIXME Ignoring any type issue on purpose
        return package_json_1.default.dependencies[module];
    }
    else {
        return package_json_1.default.version;
    }
};
exports.version = version;
let cachedCtfKey;
const getCtfKey = () => {
    if (!cachedCtfKey) {
        if (process.env.CTF_KEY !== undefined && process.env.CTF_KEY !== '') {
            cachedCtfKey = process.env.CTF_KEY;
        }
        else {
            const data = node_fs_1.default.readFileSync('ctf.key', 'utf8');
            cachedCtfKey = data;
        }
    }
    return cachedCtfKey;
};
const ctfFlag = (text) => {
    return node_crypto_1.default.createHmac('sha1', getCtfKey()).update(text).digest('hex');
};
exports.ctfFlag = ctfFlag;
const toMMMYY = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return months[month] + year.toString().substring(2, 4);
};
exports.toMMMYY = toMMMYY;
const toISO8601 = (date) => {
    let day = '' + date.getDate();
    let month = '' + (date.getMonth() + 1);
    const year = date.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [year, month, day].join('-');
};
exports.toISO8601 = toISO8601;
const extractFilename = (url) => {
    let file = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
    if (file ? file.includes('?') : false) {
        file = file.substring(0, file.indexOf('?'));
    }
    return file;
};
exports.extractFilename = extractFilename;
const downloadToFile = async (url, dest) => {
    try {
        const data = await (0, download_1.default)(url);
        node_fs_1.default.writeFileSync(dest, data);
    }
    catch (err) {
        logger_1.default.warn('Failed to download ' + url + ' (' + (0, exports.getErrorMessage)(err) + ')');
    }
};
exports.downloadToFile = downloadToFile;
const jwtFrom = ({ headers }) => {
    if (headers?.authorization) {
        const parts = headers.authorization.split(' ');
        if (parts.length === 2) {
            const scheme = parts[0];
            const token = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                return token;
            }
        }
    }
    return undefined;
};
exports.jwtFrom = jwtFrom;
const randomHexString = (length) => {
    return node_crypto_1.default.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};
exports.randomHexString = randomHexString;
function getChallengeEnablementStatus(challenge, safetyModeSetting = config_1.default.get('challenges.safetyMode'), isEnvironmentFunctions = { isDocker: is_docker_1.default, isHeroku: is_heroku_1.default, isWindows: is_windows_1.default }) {
    if (!challenge?.disabledEnv) {
        return { enabled: true, disabledBecause: null };
    }
    if (safetyModeSetting === 'disabled') {
        return { enabled: true, disabledBecause: null };
    }
    if (challenge.disabledEnv?.includes('Docker') && isEnvironmentFunctions.isDocker()) {
        return { enabled: false, disabledBecause: 'Docker' };
    }
    if (challenge.disabledEnv?.includes('Heroku') && isEnvironmentFunctions.isHeroku()) {
        return { enabled: false, disabledBecause: 'Heroku' };
    }
    if (challenge.disabledEnv?.includes('Windows') && isEnvironmentFunctions.isWindows()) {
        return { enabled: false, disabledBecause: 'Windows' };
    }
    if (challenge.disabledEnv && safetyModeSetting === 'enabled') {
        return { enabled: false, disabledBecause: 'Safety Mode' };
    }
    return { enabled: true, disabledBecause: null };
}
function isChallengeEnabled(challenge) {
    const { enabled } = getChallengeEnablementStatus(challenge);
    return enabled;
}
const parseJsonCustom = (jsonString) => {
    const parser = clarinet_1.default.parser();
    const result = [];
    parser.onkey = parser.onopenobject = (k) => {
        result.push({ key: k, value: null });
    };
    parser.onvalue = (v) => {
        result[result.length - 1].value = v;
    };
    parser.write(jsonString);
    parser.close();
    return result;
};
exports.parseJsonCustom = parseJsonCustom;
const toSimpleIpAddress = (ipv6) => {
    if (ipv6?.startsWith('::ffff:')) {
        return ipv6.substr(7);
    }
    else if (ipv6 === '::1') {
        return '127.0.0.1';
    }
    else {
        return ipv6;
    }
};
exports.toSimpleIpAddress = toSimpleIpAddress;
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return String(error);
};
exports.getErrorMessage = getErrorMessage;
const matchesSystemIniFile = (text) => {
    const match = text.match(/; for 16-bit app support/gi);
    return match !== null && match.length >= 1;
};
exports.matchesSystemIniFile = matchesSystemIniFile;
const matchesEtcPasswdFile = (text) => {
    const match = text.match(/(\w*:\w*:\d*:\d*:\w*:.*)|(Note that this file is consulted directly)/gi);
    return match !== null && match.length >= 1;
};
exports.matchesEtcPasswdFile = matchesEtcPasswdFile;
function diceCoefficient(s1, s2, n = 2) {
    if (s1 === s2)
        return 1;
    if (s1.length < n || s2.length < n)
        return 0;
    const nGrams1 = new Map();
    for (let i = 0; i <= s1.length - n; i++) {
        const nGram = s1.substring(i, i + n);
        nGrams1.set(nGram, (nGrams1.get(nGram) ?? 0) + 1);
    }
    let intersectionSize = 0;
    for (let i = 0; i <= s2.length - n; i++) {
        const nGram = s2.substring(i, i + n);
        const count = nGrams1.get(nGram) ?? 0;
        if (count > 0) {
            nGrams1.set(nGram, count - 1);
            intersectionSize++;
        }
    }
    return (2.0 * intersectionSize) / (s1.length + s2.length - 2 * (n - 1));
}
/**
 * Wrapper for asynchronous Express route handlers to ensure any rejected promises are caught and passed to the next() function.
 * TODO: Revisit the need for this wrapper once the project is migrated to Express 5 which supports async handlers natively.
 */
const asyncHandler = (fn) => (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=utils.js.map