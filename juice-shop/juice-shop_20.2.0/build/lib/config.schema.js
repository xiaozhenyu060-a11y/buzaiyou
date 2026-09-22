"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchema = exports.AppConfigSchema = exports.CtfSchema = exports.CountryMappingSchema = exports.ChallengeKeySchema = exports.MemorySchema = exports.ProductSchema = exports.HackingInstructorSchema = exports.ChallengesSchema = exports.ApplicationSchema = exports.ServerSchema = void 0;
const zod_1 = require("zod");
const challenge_1 = require("../models/challenge");
// -- Application sub-schemas --
const ChatBotSchema = zod_1.z.object({
    name: zod_1.z.string(),
    avatar: zod_1.z.string(),
    model: zod_1.z.string(),
    llmApiUrl: zod_1.z.string(),
    llmMaxRetries: zod_1.z.number().optional(),
    sampleQuestions: zod_1.z.array(zod_1.z.string()).optional()
});
const SocialSchema = zod_1.z.object({
    twitterUrl: zod_1.z.string(),
    facebookUrl: zod_1.z.string(),
    slackUrl: zod_1.z.string(),
    redditUrl: zod_1.z.string(),
    pressKitUrl: zod_1.z.string(),
    nftUrl: zod_1.z.string().nullable(),
    questionnaireUrl: zod_1.z.string().nullable(),
    blueSkyUrl: zod_1.z.string().optional(),
    mastodonUrl: zod_1.z.string().optional()
});
const RecyclePageSchema = zod_1.z.object({
    topProductImage: zod_1.z.string(),
    bottomProductImage: zod_1.z.string()
});
const WelcomeBannerSchema = zod_1.z.object({
    showOnFirstStart: zod_1.z.boolean(),
    title: zod_1.z.string(),
    message: zod_1.z.string()
});
const CookieConsentSchema = zod_1.z.object({
    message: zod_1.z.string(),
    dismissText: zod_1.z.string(),
    linkText: zod_1.z.string(),
    linkUrl: zod_1.z.string()
});
const SecurityTxtSchema = zod_1.z.object({
    contact: zod_1.z.string(),
    encryption: zod_1.z.string(),
    acknowledgements: zod_1.z.string(),
    hiring: zod_1.z.string(),
    csaf: zod_1.z.string()
});
const PromotionSchema = zod_1.z.object({
    video: zod_1.z.string(),
    subtitles: zod_1.z.string()
});
const EasterEggPlanetSchema = zod_1.z.object({
    name: zod_1.z.string(),
    overlayMap: zod_1.z.string()
});
const GoogleOauthSchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    authorizedRedirects: zod_1.z.array(zod_1.z.object({ uri: zod_1.z.string(), proxy: zod_1.z.string().optional() }))
});
// -- Section schemas --
exports.ServerSchema = zod_1.z.object({
    port: zod_1.z.number(),
    basePath: zod_1.z.string(),
    baseUrl: zod_1.z.string()
});
exports.ApplicationSchema = zod_1.z.object({
    domain: zod_1.z.string(),
    name: zod_1.z.string(),
    logo: zod_1.z.string(),
    favicon: zod_1.z.string(),
    theme: zod_1.z.enum(['deeppurple-amber', 'indigo-pink', 'pink-bluegrey', 'purple-green', 'blue-lightblue', 'bluegrey-lightgreen', 'deeporange-indigo', 'lime-green', 'neon-fire']),
    showVersionNumber: zod_1.z.boolean(),
    showGitHubLinks: zod_1.z.boolean(),
    localBackupEnabled: zod_1.z.boolean(),
    numberOfRandomFakeUsers: zod_1.z.number(),
    altcoinName: zod_1.z.string(),
    privacyContactEmail: zod_1.z.string(),
    customMetricsPrefix: zod_1.z.string(),
    chatBot: ChatBotSchema,
    social: SocialSchema,
    recyclePage: RecyclePageSchema,
    welcomeBanner: WelcomeBannerSchema,
    cookieConsent: CookieConsentSchema,
    securityTxt: SecurityTxtSchema,
    promotion: PromotionSchema,
    easterEggPlanet: EasterEggPlanetSchema,
    googleOauth: GoogleOauthSchema
});
exports.ChallengesSchema = zod_1.z.object({
    showSolvedNotifications: zod_1.z.boolean(),
    showHints: zod_1.z.boolean(),
    showMitigations: zod_1.z.boolean(),
    codingChallengesEnabled: zod_1.z.enum(['never', 'solved', 'always']),
    restrictToTutorialsFirst: zod_1.z.boolean(),
    overwriteUrlForProductTamperingChallenge: zod_1.z.string(),
    overwriteUrlForCsrfChallenge: zod_1.z.string(),
    xssBonusPayload: zod_1.z.string(),
    safetyMode: zod_1.z.enum(['enabled', 'disabled', 'auto']).optional(),
    csafHashValue: zod_1.z.string(),
    metricsIgnoredUserAgents: zod_1.z.array(zod_1.z.string()).optional()
});
exports.HackingInstructorSchema = zod_1.z.object({
    isEnabled: zod_1.z.boolean(),
    avatarImage: zod_1.z.string(),
    hintPlaybackSpeed: zod_1.z.enum(['faster', 'fast', 'normal', 'slow', 'slower'])
});
exports.ProductSchema = zod_1.z.object({
    name: zod_1.z.string(),
    price: zod_1.z.number(),
    description: zod_1.z.string(),
    image: zod_1.z.string(),
    deluxePrice: zod_1.z.number().optional(),
    limitPerUser: zod_1.z.number().optional(),
    reviews: zod_1.z.array(zod_1.z.object({ text: zod_1.z.string(), author: zod_1.z.string() })).optional(),
    urlForProductTamperingChallenge: zod_1.z.string().optional(),
    useForChristmasSpecialChallenge: zod_1.z.boolean().optional(),
    keywordsForPastebinDataLeakChallenge: zod_1.z.array(zod_1.z.string()).optional(),
    deletedDate: zod_1.z.string().optional(),
    quantity: zod_1.z.number().optional(),
    fileForRetrieveBlueprintChallenge: zod_1.z.string().optional(),
    exifForBlueprintChallenge: zod_1.z.array(zod_1.z.string()).optional()
});
exports.MemorySchema = zod_1.z.object({
    image: zod_1.z.string(),
    caption: zod_1.z.string(),
    user: zod_1.z.string().optional(),
    geoStalkingMetaSecurityQuestion: zod_1.z.number().optional(),
    geoStalkingMetaSecurityAnswer: zod_1.z.string().optional(),
    geoStalkingVisualSecurityQuestion: zod_1.z.number().optional(),
    geoStalkingVisualSecurityAnswer: zod_1.z.string().optional()
});
// Challenge country mapping keyed by ChallengeKey.
exports.ChallengeKeySchema = zod_1.z.enum(challenge_1.CHALLENGE_KEYS);
const CountryEntrySchema = zod_1.z.object({ name: zod_1.z.string(), code: zod_1.z.string() });
exports.CountryMappingSchema = zod_1.z.record(exports.ChallengeKeySchema, CountryEntrySchema);
exports.CtfSchema = zod_1.z.object({
    showFlagsInNotifications: zod_1.z.boolean(),
    showCountryDetailsInNotifications: zod_1.z.enum(['none', 'name', 'flag', 'both']),
    countryMapping: exports.CountryMappingSchema.nullable().optional(),
    systemWideNotifications: zod_1.z.object({
        url: zod_1.z.string().nullable().optional(),
        pollFrequencySeconds: zod_1.z.number().nullable().optional()
    }).optional()
});
exports.AppConfigSchema = zod_1.z.object({
    server: exports.ServerSchema,
    application: exports.ApplicationSchema,
    challenges: exports.ChallengesSchema,
    hackingInstructor: exports.HackingInstructorSchema,
    products: zod_1.z.array(exports.ProductSchema),
    memories: zod_1.z.array(exports.MemorySchema),
    ctf: exports.CtfSchema
});
// Recursively drops null-valued object keys and null array elements.
// custom configs use null to signal that a value from the default.yml should be overwritten
const dropNulls = (value) => {
    if (Array.isArray(value)) {
        return value.filter((entry) => entry != null).map(dropNulls);
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value)
            .filter(([, entry]) => entry != null)
            .map(([key, entry]) => [key, dropNulls(entry)]));
    }
    return value;
};
// Deep-partial schema for validating possibly-incomplete individual YAML config files.
exports.ValidationSchema = zod_1.z.preprocess(dropNulls, zod_1.z.object({
    server: exports.ServerSchema.partial().optional(),
    application: exports.ApplicationSchema.partial().extend({
        chatBot: ChatBotSchema.partial().optional(),
        social: SocialSchema.partial().optional(),
        recyclePage: RecyclePageSchema.partial().optional(),
        welcomeBanner: WelcomeBannerSchema.partial().optional(),
        cookieConsent: CookieConsentSchema.partial().optional(),
        securityTxt: SecurityTxtSchema.partial().optional(),
        promotion: PromotionSchema.partial().optional(),
        easterEggPlanet: EasterEggPlanetSchema.partial().optional(),
        googleOauth: GoogleOauthSchema.partial().optional()
    }).optional(),
    challenges: exports.ChallengesSchema.partial().optional(),
    hackingInstructor: exports.HackingInstructorSchema.partial().optional(),
    products: zod_1.z.array(exports.ProductSchema.partial()).optional(),
    memories: zod_1.z.array(exports.MemorySchema.partial()).optional(),
    ctf: exports.CtfSchema.partial().optional()
}));
//# sourceMappingURL=config.schema.js.map