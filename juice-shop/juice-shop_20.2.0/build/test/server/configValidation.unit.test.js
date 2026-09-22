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
const validateConfig_1 = __importStar(require("../../lib/startup/validateConfig"));
void (0, node_test_1.describe)('configValidation', () => {
    const COMMON_PRODUCT = { price: 1, description: 'foo', image: 'bar.jpg' };
    void (0, node_test_1.describe)('checkUnambiguousMandatorySpecialProducts', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Melon Juice', fileForRetrieveBlueprintChallenge: 'foobar', exifForBlueprintChallenge: ['OpenSCAD'] },
                { ...COMMON_PRODUCT, name: 'Rippertuer Special Juice', keywordsForPastebinDataLeakChallenge: ['bla', 'blubb'] }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialProducts)(products), true);
        });
        void (0, node_test_1.it)('should fail if multiple products are configured for the same challenge', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Melon Bike', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Melon Juice', fileForRetrieveBlueprintChallenge: 'foobar', exifForBlueprintChallenge: ['OpenSCAD'] }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialProducts)(products), false);
        });
        void (0, node_test_1.it)('should fail if a required challenge product is missing', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialProducts)(products), false);
        });
    });
    void (0, node_test_1.describe)('checkNecessaryExtraKeysOnSpecialProducts', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Melon Juice', fileForRetrieveBlueprintChallenge: 'foobar', exifForBlueprintChallenge: ['OpenSCAD'] },
                { ...COMMON_PRODUCT, name: 'Rippertuer Special Juice', keywordsForPastebinDataLeakChallenge: ['bla', 'blubb'] }
            ];
            strict_1.default.equal((0, validateConfig_1.checkNecessaryExtraKeysOnSpecialProducts)(products), true);
        });
        void (0, node_test_1.it)('should fail if product has no exifForBlueprintChallenge', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Melon Juice', fileForRetrieveBlueprintChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Rippertuer Special Juice', keywordsForPastebinDataLeakChallenge: ['bla', 'blubb'] }
            ];
            strict_1.default.equal((0, validateConfig_1.checkNecessaryExtraKeysOnSpecialProducts)(products), false);
        });
    });
    void (0, node_test_1.describe)('checkUniqueSpecialOnProducts', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true },
                { ...COMMON_PRODUCT, name: 'Orange Juice', urlForProductTamperingChallenge: 'foobar' },
                { ...COMMON_PRODUCT, name: 'Melon Juice', fileForRetrieveBlueprintChallenge: 'foobar', exifForBlueprintChallenge: ['OpenSCAD'] },
                { ...COMMON_PRODUCT, name: 'Rippertuer Special Juice', keywordsForPastebinDataLeakChallenge: ['bla', 'blubb'] }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUniqueSpecialOnProducts)(products), true);
        });
        void (0, node_test_1.it)('should fail if a product is configured for multiple challenges', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice', useForChristmasSpecialChallenge: true, urlForProductTamperingChallenge: 'foobar' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUniqueSpecialOnProducts)(products), false);
        });
    });
    void (0, node_test_1.describe)('checkMinimumRequiredNumberOfProducts', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice' },
                { ...COMMON_PRODUCT, name: 'Orange Juice' },
                { ...COMMON_PRODUCT, name: 'Melon Juice' },
                { ...COMMON_PRODUCT, name: 'Rippertuer Special Juice' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkMinimumRequiredNumberOfProducts)(products), true);
        });
        void (0, node_test_1.it)('should fail if less than 4 products are configured', () => {
            const products = [
                { ...COMMON_PRODUCT, name: 'Apple Juice' },
                { ...COMMON_PRODUCT, name: 'Orange Juice' },
                { ...COMMON_PRODUCT, name: 'Melon Juice' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkMinimumRequiredNumberOfProducts)(products), false);
        });
    });
    void (0, node_test_1.describe)('checkUnambiguousMandatorySpecialMemories', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' },
                { image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialMemories)(memories), true);
        });
        void (0, node_test_1.it)('should fail if multiple memories are configured for the same challenge', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' },
                { image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' },
                { image: 'lalala.png', caption: 'Lalala', geoStalkingMetaSecurityQuestion: 46, geoStalkingMetaSecurityAnswer: 'foobarfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialMemories)(memories), false);
        });
        void (0, node_test_1.it)('should fail if a required challenge memory is missing', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialMemories)(memories), false);
        });
        void (0, node_test_1.it)('should fail if memories have mixed up the required challenge keys', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingVisualSecurityAnswer: 'foobar' },
                { image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingMetaSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUnambiguousMandatorySpecialMemories)(memories), false);
        });
    });
    void (0, node_test_1.describe)('checkThatThereIsOnlyOneMemoryPerSpecial', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' },
                { image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUniqueSpecialOnMemories)(memories), true);
        });
        void (0, node_test_1.it)('should fail if a memory is configured for multiple challenges', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkUniqueSpecialOnMemories)(memories), false);
        });
    });
    void (0, node_test_1.describe)('checkSpecialMemoriesHaveNoUserAssociated', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' },
                { image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkSpecialMemoriesHaveNoUserAssociated)(memories), true);
        });
        void (0, node_test_1.it)('should accept a config where the default users are associated', () => {
            const memories = [
                { user: 'john', image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' },
                { user: 'emma', image: 'blubb.png', caption: 'Blubb', geoStalkingVisualSecurityQuestion: 43, geoStalkingVisualSecurityAnswer: 'barfoo' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkSpecialMemoriesHaveNoUserAssociated)(memories), true);
        });
        void (0, node_test_1.it)('should fail if a memory is linked to another user', () => {
            const memories = [
                { user: 'admin', image: 'bla.png', caption: 'Bla', geoStalkingMetaSecurityQuestion: 42, geoStalkingMetaSecurityAnswer: 'foobar' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkSpecialMemoriesHaveNoUserAssociated)(memories), false);
        });
    });
    void (0, node_test_1.describe)('checkMinimumRequiredNumberOfMemories', () => {
        void (0, node_test_1.it)('should accept a valid config', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', user: 'admin' },
                { image: 'blubb.png', caption: 'Blubb', user: 'bjoern' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkMinimumRequiredNumberOfMemories)(memories), true);
        });
        void (0, node_test_1.it)('should fail if less than 2 memories are configured', () => {
            const memories = [
                { image: 'bla.png', caption: 'Bla', user: 'admin' }
            ];
            strict_1.default.equal((0, validateConfig_1.checkMinimumRequiredNumberOfMemories)(memories), false);
        });
    });
    void (0, node_test_1.it)(`should accept the active config from config/${process.env.NODE_ENV}.yml`, async () => {
        strict_1.default.equal(await (0, validateConfig_1.default)({ exitOnFailure: false }), true);
    });
    void (0, node_test_1.it)('should fail if the config is invalid', async () => {
        strict_1.default.equal(await (0, validateConfig_1.default)({ products: [], exitOnFailure: false }), false);
    });
    void (0, node_test_1.it)('should accept a config with valid schema', () => {
        const config = {
            application: {
                domain: 'juice-b.ox',
                name: 'OWASP Juice Box',
                welcomeBanner: { showOnFirstStart: false }
            },
            hackingInstructor: { avatarImage: 'juicyEvilWasp.png' }
        };
        strict_1.default.equal((0, validateConfig_1.checkConfigSchema)(config), true);
    });
    void (0, node_test_1.it)('should accept a config that blanks out arbitrary fields with null', () => {
        const config = {
            application: {
                name: null,
                logo: null,
                social: { twitterUrl: null, facebookUrl: null },
                securityTxt: { encryption: null }
            },
            server: { port: null }
        };
        strict_1.default.equal((0, validateConfig_1.checkConfigSchema)(config), true);
    });
    void (0, node_test_1.it)('should fail for a config with schema errors', () => {
        const config = {
            application: {
                domain: 42,
                id: 'OWASP Juice Box',
                welcomeBanner: { showOnFirstStart: 'yes' }
            },
            hackingInstructor: { avatarImage: true }
        };
        strict_1.default.equal((0, validateConfig_1.checkConfigSchema)(config), false);
    });
    void (0, node_test_1.describe)('checkForIllogicalCombos', () => {
        const BASE_CONFIG = {
            challenges: { restrictToTutorialsFirst: false, showSolvedNotifications: true },
            hackingInstructor: { isEnabled: true },
            ctf: { showFlagsInNotifications: false, showCountryDetailsInNotifications: 'none' }
        };
        void (0, node_test_1.it)('should accept a config without systemWideNotifications set', () => {
            strict_1.default.equal((0, validateConfig_1.checkForIllogicalCombos)(BASE_CONFIG), true);
        });
        void (0, node_test_1.it)('should accept a config with systemWideNotifications url and pollFrequencySeconds set', () => {
            const config = { ...BASE_CONFIG, ctf: { ...BASE_CONFIG.ctf, systemWideNotifications: { url: 'http://example.com/notify', pollFrequencySeconds: 30 } } };
            strict_1.default.equal((0, validateConfig_1.checkForIllogicalCombos)(config), true);
        });
        void (0, node_test_1.it)('should fail if systemWideNotifications url is set but pollFrequencySeconds is missing', () => {
            const config = { ...BASE_CONFIG, ctf: { ...BASE_CONFIG.ctf, systemWideNotifications: { url: 'http://example.com/notify' } } };
            strict_1.default.equal((0, validateConfig_1.checkForIllogicalCombos)(config), false);
        });
        void (0, node_test_1.it)('should fail if systemWideNotifications url is set but pollFrequencySeconds is zero', () => {
            const config = { ...BASE_CONFIG, ctf: { ...BASE_CONFIG.ctf, systemWideNotifications: { url: 'http://example.com/notify', pollFrequencySeconds: 0 } } };
            strict_1.default.equal((0, validateConfig_1.checkForIllogicalCombos)(config), false);
        });
        void (0, node_test_1.it)('should fail if systemWideNotifications url is set but pollFrequencySeconds is negative', () => {
            const config = { ...BASE_CONFIG, ctf: { ...BASE_CONFIG.ctf, systemWideNotifications: { url: 'http://example.com/notify', pollFrequencySeconds: -10 } } };
            strict_1.default.equal((0, validateConfig_1.checkForIllogicalCombos)(config), false);
        });
    });
});
//# sourceMappingURL=configValidation.unit.test.js.map