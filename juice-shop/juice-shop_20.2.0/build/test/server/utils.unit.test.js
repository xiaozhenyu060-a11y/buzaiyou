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
const utils = __importStar(require("../../lib/utils"));
void (0, node_test_1.describe)('utils', () => {
    void (0, node_test_1.describe)('toSimpleIpAddress', () => {
        void (0, node_test_1.it)('returns ipv6 address unchanged', () => {
            strict_1.default.equal(utils.toSimpleIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });
        void (0, node_test_1.it)('returns ipv4 address fully specified as ipv6 unchanged', () => {
            strict_1.default.equal(utils.toSimpleIpAddress('0:0:0:0:0:ffff:7f00:1'), '0:0:0:0:0:ffff:7f00:1');
        });
        void (0, node_test_1.it)('returns ipv6 loopback address as ipv4 address', () => {
            strict_1.default.equal(utils.toSimpleIpAddress('::1'), '127.0.0.1');
        });
        void (0, node_test_1.it)('returns ipv4-mapped address as ipv4 address', () => {
            strict_1.default.equal(utils.toSimpleIpAddress('::ffff:192.0.2.128'), '192.0.2.128');
        });
    });
    void (0, node_test_1.describe)('queryResultToJson', () => {
        void (0, node_test_1.it)('returns object with status success and passed data by default', () => {
            strict_1.default.deepEqual(utils.queryResultToJson('test'), { status: 'success', data: 'test' });
        });
        void (0, node_test_1.it)('returns object with passed status and passed data', () => {
            strict_1.default.deepEqual(utils.queryResultToJson('test', 'error'), { status: 'error', data: 'test' });
        });
    });
    void (0, node_test_1.describe)('extractFilename', () => {
        void (0, node_test_1.it)('returns standalone filename unchanged', () => {
            strict_1.default.equal(utils.extractFilename('test.exe'), 'test.exe');
        });
        void (0, node_test_1.it)('returns filename from http:// URL', () => {
            strict_1.default.equal(utils.extractFilename('http://bla.blubb/test.exe'), 'test.exe');
        });
        void (0, node_test_1.it)('ignores query part of http:// URL', () => {
            strict_1.default.equal(utils.extractFilename('http://bla.blubb/test.exe?bla=blubb&a=b'), 'test.exe');
        });
        void (0, node_test_1.it)('also works for file:// URLs', () => {
            strict_1.default.equal(utils.extractFilename('file:///C//Bla/Blubb/test.exe'), 'test.exe');
        });
    });
    void (0, node_test_1.describe)('matchesSystemIniFile', () => {
        void (0, node_test_1.it)('fails on plain input string', () => {
            strict_1.default.equal(utils.matchesSystemIniFile('Bla Blubb'), false);
        });
        void (0, node_test_1.it)('passes on Windows 10 system.ini file content', () => {
            strict_1.default.equal(utils.matchesSystemIniFile('; for 16-bit app support\n' +
                '[386Enh]\n' +
                'woafont=dosapp.fon\n' +
                'EGA80WOA.FON=EGA80WOA.FON\n' +
                'EGA40WOA.FON=EGA40WOA.FON\n' +
                'CGA80WOA.FON=CGA80WOA.FON\n' +
                'CGA40WOA.FON=CGA40WOA.FON\n' +
                '\n' +
                '[drivers]\n' +
                'wave=mmdrv.dll\n' +
                'timer=timer.drv\n' +
                '\n' +
                '[mci]\n'), true);
        });
    });
    void (0, node_test_1.describe)('matchesEtcPasswdFile', () => {
        void (0, node_test_1.it)('fails on plain input string', () => {
            strict_1.default.equal(utils.matchesEtcPasswdFile('Bla Blubb'), false);
        });
        void (0, node_test_1.it)('passes on Arch Linux passwd file content', () => {
            strict_1.default.equal(utils.matchesEtcPasswdFile('test:x:0:0:test:/test:/usr/bin/zsh\n' +
                'bin:x:1:1::/:/usr/bin/nologin\n' +
                'daemon:x:2:2::/:/usr/bin/nologin\n' +
                'mail:x:8:12::/var/spool/mail:/usr/bin/nologin\n' +
                'ftp:x:14:11::/srv/ftp:/usr/bin/nologin\n' +
                'http:x:33:33::/srv/http:/usr/bin/nologin\n' +
                'nobody:x:65534:65534:Nobody:/:/usr/bin/nologin\n' +
                'dbus:x:81:81:System Message Bus:/:/usr/bin/nologin\n' +
                'systemd-journal-remote:x:988:988:systemd Journal Remote:/:/usr/bin/nologin\n' +
                'systemd-network:x:987:987:systemd Network Management:/:/usr/bin/nologin\n' +
                'systemd-oom:x:986:986:systemd Userspace OOM Killer:/:/usr/bin/nologin\n' +
                'systemd-resolve:x:984:984:systemd Resolver:/:/usr/bin/nologin\n' +
                'systemd-timesync:x:983:983:systemd Time Synchronization:/:/usr/bin/nologin\n' +
                'systemd-coredump:x:982:982:systemd Core Dumper:/:/usr/bin/nologin\n' +
                'uuidd:x:68:68::/:/usr/bin/nologin\n' +
                'avahi:x:980:980:Avahi mDNS/DNS-SD daemon:/:/usr/bin/nologin\n' +
                'named:x:40:40:BIND DNS Server:/:/usr/bin/nologin\n' +
                'brltty:x:979:979:Braille Device Daemon:/var/lib/brltty:/usr/bin/nologin\n' +
                'colord:x:978:978:Color management daemon:/var/lib/colord:/usr/bin/nologin\n' +
                'cups:x:209:209:cups helper user:/:/usr/bin/nologin\n' +
                'dhcpcd:x:977:977:dhcpcd privilege separation:/:/usr/bin/nologin\n' +
                'dnsmasq:x:976:976:dnsmasq daemon:/:/usr/bin/nologin\n' +
                'git:x:975:975:git daemon user:/:/usr/bin/git-shell\n' +
                'mpd:x:45:45::/var/lib/mpd:/usr/bin/nologin\n' +
                'nbd:x:974:974:Network Block Device:/var/empty:/usr/bin/nologin\n' +
                'nm-openvpn:x:973:973:NetworkManager OpenVPN:/:/usr/bin/nologin\n' +
                'nvidia-persistenced:x:143:143:NVIDIA Persistence Daemon:/:/usr/bin/nologin\n' +
                'openvpn:x:972:972:OpenVPN:/:/usr/bin/nologin\n' +
                'partimag:x:110:110:Partimage user:/:/usr/bin/nologin\n' +
                'polkitd:x:102:102:PolicyKit daemon:/:/usr/bin/nologin\n' +
                'rpc:x:32:32:Rpcbind Daemon:/var/lib/rpcbind:/usr/bin/nologin\n' +
                'rtkit:x:133:133:RealtimeKit:/proc:/usr/bin/nologin\n' +
                'sddm:x:971:971:Simple Desktop Display Manager:/var/lib/sddm:/usr/bin/nologin\n' +
                'tss:x:970:970:tss user for tpm2:/:/usr/bin/nologin\n' +
                'usbmux:x:140:140:usbmux user:/:/usr/bin/nologin\n' +
                'moi:x:1000:1000:moi:/home/moi:/bin/zsh\n'), true);
        });
    });
    void (0, node_test_1.describe)('getChallengeEnablementStatus', () => {
        const defaultIsEnvironmentFunctions = {
            isDocker: () => false,
            isHeroku: () => false,
            isWindows: () => false
        };
        for (const safetyMode of ['enabled', 'disabled', 'auto']) {
            void (0, node_test_1.it)(`challenges without disabledEnv are enabled with safetyMode set to ${safetyMode}`, () => {
                const challenge = { disabledEnv: null };
                strict_1.default.deepEqual(utils.getChallengeEnablementStatus(challenge, safetyMode, defaultIsEnvironmentFunctions), { enabled: true, disabledBecause: null });
            });
        }
        const testCases = [
            { name: 'Docker', environmentFunction: 'isDocker' },
            { name: 'Heroku', environmentFunction: 'isHeroku' },
            { name: 'Windows', environmentFunction: 'isWindows' }
        ];
        for (const testCase of testCases) {
            void (0, node_test_1.it)(`safetyMode: 'enabled': challenge with disabledOnEnv ${testCase.name} should be marked as disabled`, () => {
                const challenge = { disabledEnv: testCase.name };
                const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true };
                strict_1.default.deepEqual(utils.getChallengeEnablementStatus(challenge, 'enabled', isEnvironmentFunctions), { enabled: false, disabledBecause: testCase.name });
            });
            void (0, node_test_1.it)(`safetyMode: 'auto': challenge with disabledOnEnv ${testCase.name} should be marked as disabled`, () => {
                const challenge = { disabledEnv: testCase.name };
                const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true };
                strict_1.default.deepEqual(utils.getChallengeEnablementStatus(challenge, 'auto', isEnvironmentFunctions), { enabled: false, disabledBecause: testCase.name });
            });
            void (0, node_test_1.it)(`safetyMode: 'disabled': challenge with disabledOnEnv ${testCase.name} should be marked as enabled`, () => {
                const challenge = { disabledEnv: testCase.name };
                const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true };
                strict_1.default.deepEqual(utils.getChallengeEnablementStatus(challenge, 'disabled', isEnvironmentFunctions), { enabled: true, disabledBecause: null });
            });
        }
    });
    void (0, node_test_1.describe)('toISO8601', () => {
        void (0, node_test_1.it)('converts date to ISO 8601 representation', () => {
            strict_1.default.equal(utils.toISO8601(new Date('2025-12-15T00:00:00Z')), '2025-12-15');
        });
        void (0, node_test_1.it)('prepends single-digit months with a zero', () => {
            strict_1.default.equal(utils.toISO8601(new Date('2025-03-15T00:00:00Z')), '2025-03-15');
        });
        void (0, node_test_1.it)('prepends single-digit days with a zero', () => {
            strict_1.default.equal(utils.toISO8601(new Date('2025-12-01T00:00:00Z')), '2025-12-01');
        });
    });
    void (0, node_test_1.describe)('parseJsonCustom', () => {
        void (0, node_test_1.it)('parses a simple JSON object', () => {
            const json = '{"key": "value"}';
            const result = utils.parseJsonCustom(json);
            strict_1.default.deepEqual(result, [{ key: 'key', value: 'value' }]);
        });
        void (0, node_test_1.it)('parses a nested JSON object', () => {
            const json = '{"key": {"nested": "value"}}';
            const result = utils.parseJsonCustom(json);
            // clarinet's onkey/onopenobject will produce entries for both keys
            strict_1.default.equal(result.length, 2);
            strict_1.default.equal(result[0].key, 'key');
            strict_1.default.equal(result[1].key, 'nested');
            strict_1.default.equal(result[1].value, 'value');
        });
    });
    void (0, node_test_1.describe)('containsOrEscaped', () => {
        void (0, node_test_1.it)('returns true if string contains element', () => {
            strict_1.default.equal(utils.containsOrEscaped('abc"def', 'abc'), true);
        });
        void (0, node_test_1.it)('returns true if string contains escaped element', () => {
            strict_1.default.equal(utils.containsOrEscaped('abc\\"def', 'abc"def'), true);
        });
        void (0, node_test_1.it)('returns false if string contains neither element nor escaped element', () => {
            strict_1.default.equal(utils.containsOrEscaped('abcdef', 'xyz'), false);
        });
    });
    void (0, node_test_1.describe)('unquote', () => {
        void (0, node_test_1.it)('removes quotes from quoted string', () => {
            strict_1.default.equal(utils.unquote('"test"'), 'test');
        });
        void (0, node_test_1.it)('returns unquoted string unchanged', () => {
            strict_1.default.equal(utils.unquote('test'), 'test');
        });
    });
    void (0, node_test_1.describe)('trunc', () => {
        void (0, node_test_1.it)('truncates long string and adds ellipses', () => {
            strict_1.default.equal(utils.trunc('1234567890', 5), '1234...');
        });
        void (0, node_test_1.it)('returns short string unchanged', () => {
            strict_1.default.equal(utils.trunc('123', 5), '123');
        });
        void (0, node_test_1.it)('removes newlines', () => {
            strict_1.default.equal(utils.trunc('12\n3', 5), '123');
        });
    });
    void (0, node_test_1.describe)('diceCoefficient', () => {
        void (0, node_test_1.it)('should return 1 for identical strings', () => {
            strict_1.default.equal(utils.diceCoefficient('abc', 'abc'), 1);
        });
        void (0, node_test_1.it)('should return 1 for identical strings even if they are short', () => {
            strict_1.default.equal(utils.diceCoefficient('a', 'a'), 1);
        });
        void (0, node_test_1.it)('should return 0 for different strings if at least one is less than 2 characters', () => {
            strict_1.default.equal(utils.diceCoefficient('a', 'b'), 0);
            strict_1.default.equal(utils.diceCoefficient('a', 'abc'), 0);
        });
        void (0, node_test_1.it)('should return 0 for completely different strings', () => {
            strict_1.default.equal(utils.diceCoefficient('abc', 'def'), 0);
        });
        void (0, node_test_1.it)('should return correct coefficient for partially overlapping strings', () => {
            // 'night' bigrams: ni, ig, gh, ht
            // 'nacht' bigrams: na, ac, ch, ht
            // intersection: ht (1)
            // score: 2 * 1 / (5 + 5 - 2) = 0.25
            strict_1.default.equal(utils.diceCoefficient('night', 'nacht'), 0.25);
        });
    });
    void (0, node_test_1.describe)('toMMMYY', () => {
        void (0, node_test_1.it)('returns MMMYY representation of date', () => {
            strict_1.default.equal(utils.toMMMYY(new Date('1980-01-02')), 'JAN80');
            strict_1.default.equal(utils.toMMMYY(new Date('2026-12-31')), 'DEC26');
        });
    });
    void (0, node_test_1.describe)('isUrl', () => {
        void (0, node_test_1.it)('returns true for strings starting with http', () => {
            strict_1.default.ok(utils.isUrl('http://test.com'));
            strict_1.default.ok(utils.isUrl('https://test.com'));
        });
        void (0, node_test_1.it)('returns false for strings not starting with http', () => {
            strict_1.default.ok(!utils.isUrl('ftp://test.com'));
            strict_1.default.ok(!utils.isUrl('test.com'));
        });
    });
    void (0, node_test_1.describe)('version', () => {
        void (0, node_test_1.it)('returns package version if no module is specified', () => {
            strict_1.default.ok(utils.version());
        });
        void (0, node_test_1.it)('returns module version if module is specified', () => {
            strict_1.default.ok(utils.version('express'));
        });
    });
    void (0, node_test_1.describe)('jwtFrom', () => {
        void (0, node_test_1.it)('extracts token from authorization header', () => {
            strict_1.default.equal(utils.jwtFrom({ headers: { authorization: 'Bearer 12345' } }), '12345');
            strict_1.default.equal(utils.jwtFrom({ headers: { authorization: 'bearer abcde' } }), 'abcde');
        });
        void (0, node_test_1.it)('returns undefined if authorization header is missing or malformed', () => {
            strict_1.default.equal(utils.jwtFrom({ headers: {} }), undefined);
            strict_1.default.equal(utils.jwtFrom({ headers: { authorization: '12345' } }), undefined);
            strict_1.default.equal(utils.jwtFrom({ headers: { authorization: 'Basic 12345' } }), undefined);
        });
    });
    void (0, node_test_1.describe)('randomHexString', () => {
        void (0, node_test_1.it)('returns random hex string of specified length', () => {
            strict_1.default.equal(utils.randomHexString(10).length, 10);
            strict_1.default.equal(utils.randomHexString(1).length, 1);
        });
    });
    void (0, node_test_1.describe)('getErrorMessage', () => {
        void (0, node_test_1.it)('returns message if error is an Error object', () => {
            strict_1.default.equal(utils.getErrorMessage(new Error('Test error')), 'Test error');
        });
        void (0, node_test_1.it)('returns string representation if error is not an Error object', () => {
            strict_1.default.equal(utils.getErrorMessage('Test error'), 'Test error');
            strict_1.default.equal(utils.getErrorMessage({}), '[object Object]');
        });
    });
});
//# sourceMappingURL=utils.unit.test.js.map