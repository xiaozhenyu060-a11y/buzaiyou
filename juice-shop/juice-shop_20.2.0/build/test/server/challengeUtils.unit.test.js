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
const antiCheat = require('../../lib/antiCheat');
const accuracy = require('../../lib/accuracy');
const { ChallengeModel } = require('../../models/challenge');
const { HintModel } = require('../../models/hint');
const datacache = require('../../data/datacache');
const config = require('config');
const logger = require('../../lib/logger').default;
const challengeUtils = require('../../lib/challengeUtils');
void (0, node_test_1.describe)('challengeUtils', () => {
    (0, node_test_1.beforeEach)(() => {
        datacache.challenges.scoreBoardChallenge = { id: 42, name: 'scoreBoardChallenge', key: 'scoreBoardChallenge', difficulty: 1 };
        datacache.notifications.length = 0;
        global.io = { emit: node_test_1.mock.fn() };
        antiCheat.reset();
        accuracy.reset();
        HintModel.count = node_test_1.mock.fn(async () => 0);
        ChallengeModel.update = node_test_1.mock.fn(async () => [1]);
    });
    void (0, node_test_1.describe)('findChallengeByName', () => {
        void (0, node_test_1.it)('returns undefined for non-existing challenge', () => {
            strict_1.default.equal(challengeUtils.findChallengeByName('blubbChallenge'), undefined);
        });
        void (0, node_test_1.it)('returns existing challenge', () => {
            strict_1.default.equal(challengeUtils.findChallengeByName('scoreBoardChallenge'), datacache.challenges.scoreBoardChallenge);
        });
    });
    void (0, node_test_1.describe)('findChallengeById', () => {
        void (0, node_test_1.it)('returns undefined for non-existing challenge', () => {
            strict_1.default.equal(challengeUtils.findChallengeById(43), undefined);
        });
        void (0, node_test_1.it)('returns existing challenge', () => {
            strict_1.default.equal(challengeUtils.findChallengeById(42), datacache.challenges.scoreBoardChallenge);
        });
    });
    void (0, node_test_1.describe)('notSolved', () => {
        void (0, node_test_1.it)('returns true for unsolved challenge', () => {
            strict_1.default.equal(challengeUtils.notSolved({ solved: false }), true);
        });
        void (0, node_test_1.it)('returns false for solved challenge', () => {
            strict_1.default.equal(challengeUtils.notSolved({ solved: true }), false);
        });
        void (0, node_test_1.it)('returns falsy for null challenge', () => {
            strict_1.default.equal(challengeUtils.notSolved(null), null);
        });
    });
    void (0, node_test_1.describe)('solve', () => {
        void (0, node_test_1.it)('should mark challenge as solved and save it', async () => {
            const challenge = {
                solved: false,
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                difficulty: 1,
                id: 1,
                save: node_test_1.mock.fn(async function () { return this; })
            };
            const originalHintCount = HintModel.count;
            HintModel.count = node_test_1.mock.fn(async () => 0);
            try {
                await challengeUtils.solve(challenge);
                strict_1.default.equal(challenge.solved, true);
                strict_1.default.equal(challenge.save.mock.calls.length, 1);
                strict_1.default.equal(datacache.notifications.length, 1);
                strict_1.default.equal(datacache.notifications[0].key, 'scoreBoardChallenge');
            }
            finally {
                HintModel.count = originalHintCount;
            }
        });
        void (0, node_test_1.it)('should not calculate cheat score if it is a restore', async () => {
            const challenge = {
                solved: false,
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                difficulty: 1,
                save: node_test_1.mock.fn(async function () { return this; })
            };
            await challengeUtils.solve(challenge, true);
            strict_1.default.equal(antiCheat.totalCheatScore(), 0);
        });
        void (0, node_test_1.it)('should log error if webhook notification fails', async () => {
            const challenge = {
                solved: false,
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                difficulty: 1,
                id: 1,
                save: node_test_1.mock.fn(async function () { return this; })
            };
            process.env.SOLUTIONS_WEBHOOK = 'http://webhook.test';
            const originalFetch = global.fetch;
            global.fetch = node_test_1.mock.fn(async () => { throw new Error('Fetch error'); });
            const originalLoggerError = logger.error;
            logger.error = node_test_1.mock.fn();
            try {
                await challengeUtils.solve(challenge);
                // Wait for unhandled promise in solve (webhook notification is not awaited)
                await new Promise(resolve => setTimeout(resolve, 10));
                strict_1.default.equal(logger.error.mock.calls.length, 1);
                strict_1.default.match(logger.error.mock.calls[0].arguments[0], /Webhook notification failed/);
            }
            finally {
                delete process.env.SOLUTIONS_WEBHOOK;
                global.fetch = originalFetch;
                logger.error = originalLoggerError;
            }
        });
    });
    void (0, node_test_1.describe)('solveIf', () => {
        void (0, node_test_1.it)('should solve challenge if criteria is met and not yet solved', async () => {
            const challenge = {
                solved: false,
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                difficulty: 1,
                save: node_test_1.mock.fn(async function () { return this; })
            };
            const criteria = () => true;
            await challengeUtils.solveIf(challenge, criteria);
            strict_1.default.equal(challenge.solved, true);
        });
    });
    void (0, node_test_1.describe)('sendCodingChallengeNotification', () => {
        void (0, node_test_1.it)('should emit "code challenge solved" event via socket.io', () => {
            const challenge = { key: 'test', codingChallengeStatus: 1 };
            challengeUtils.sendCodingChallengeNotification(challenge);
            const io = global.io;
            strict_1.default.equal(io.emit.mock.calls.length, 1);
            strict_1.default.equal(io.emit.mock.calls[0].arguments[0], 'code challenge solved');
        });
    });
    void (0, node_test_1.describe)('solveFindIt', () => {
        void (0, node_test_1.it)('should update status and calculate accuracy/cheat score', async () => {
            const challengeKey = 'scoreBoardChallenge';
            const originalUpdate = ChallengeModel.update;
            ChallengeModel.update = node_test_1.mock.fn(async () => [1]);
            try {
                await challengeUtils.solveFindIt(challengeKey);
                strict_1.default.equal(ChallengeModel.update.mock.calls.length, 1);
                strict_1.default.equal(accuracy.getFindItAttempts(challengeKey), 1);
                const io = global.io;
                strict_1.default.equal(io.emit.mock.calls.length, 1);
            }
            finally {
                ChallengeModel.update = originalUpdate;
            }
        });
        void (0, node_test_1.it)('should not calculate accuracy/cheat score if it is a restore', async () => {
            const challengeKey = 'scoreBoardChallenge';
            const originalUpdate = ChallengeModel.update;
            ChallengeModel.update = node_test_1.mock.fn(async () => [1]);
            await challengeUtils.solveFindIt(challengeKey, true);
            strict_1.default.equal(accuracy.getFindItAttempts(challengeKey), 0);
            ChallengeModel.update = originalUpdate;
        });
    });
    void (0, node_test_1.describe)('solveFixIt', () => {
        void (0, node_test_1.it)('should update status and calculate accuracy/cheat score', async () => {
            const challengeKey = 'scoreBoardChallenge';
            const originalUpdate = ChallengeModel.update;
            ChallengeModel.update = node_test_1.mock.fn(async () => [1]);
            try {
                await challengeUtils.solveFixIt(challengeKey);
                strict_1.default.equal(ChallengeModel.update.mock.calls.length, 1);
                const io = global.io;
                strict_1.default.equal(io.emit.mock.calls.length, 1);
            }
            finally {
                ChallengeModel.update = originalUpdate;
            }
        });
        void (0, node_test_1.it)('should not calculate accuracy/cheat score if it is a restore', async () => {
            const challengeKey = 'scoreBoardChallenge';
            const originalUpdate = ChallengeModel.update;
            ChallengeModel.update = node_test_1.mock.fn(async () => [1]);
            await challengeUtils.solveFixIt(challengeKey, true);
            strict_1.default.equal(ChallengeModel.update.mock.calls.length, 1);
            ChallengeModel.update = originalUpdate;
        });
    });
    void (0, node_test_1.describe)('sendNotification', () => {
        void (0, node_test_1.it)('should return early if challenge is not solved', () => {
            const challenge = {
                key: 'scoreBoardChallenge',
                solved: false
            };
            challengeUtils.sendNotification(challenge, false);
            strict_1.default.equal(datacache.notifications.length, 0);
        });
        void (0, node_test_1.it)('should push notification to datacache and emit via socket.io', (t) => {
            const challenge = {
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                description: 'Find the score board',
                solved: true
            };
            t.mock.method(config, 'get', (key) => {
                if (key === 'challenges.showSolvedNotifications')
                    return true;
                if (key === 'challenges.codingChallengesEnabled')
                    return 'always';
                return false;
            });
            challengeUtils.sendNotification(challenge, false);
            strict_1.default.equal(datacache.notifications.length, 1);
            strict_1.default.equal(datacache.notifications[0].key, 'scoreBoardChallenge');
            const io = global.io;
            strict_1.default.equal(io.emit.mock.calls.length, 1);
            strict_1.default.equal(io.emit.mock.calls[0].arguments[0], 'challenge solved');
        });
        void (0, node_test_1.it)('should handle missing fullChallenge', (t) => {
            const challenge = {
                key: 'nonExisting',
                name: 'Non Existing',
                description: 'desc',
                solved: true
            };
            challengeUtils.sendNotification(challenge, false);
            strict_1.default.equal(datacache.notifications.length, 1);
            strict_1.default.equal(datacache.notifications[0].key, 'nonExisting');
        });
        void (0, node_test_1.it)('should respect showSolvedNotifications config', (t) => {
            const challenge = {
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                description: 'desc',
                solved: true
            };
            t.mock.method(config, 'get', (key) => {
                if (key === 'challenges.showSolvedNotifications')
                    return false;
                return true;
            });
            challengeUtils.sendNotification(challenge, false);
            strict_1.default.equal(datacache.notifications[0].hidden, true);
        });
        void (0, node_test_1.it)('should handle codingChallengesEnabled set to "never"', (t) => {
            const challenge = {
                key: 'scoreBoardChallenge',
                name: 'Score Board',
                description: 'desc',
                solved: true
            };
            datacache.challenges.scoreBoardChallenge.hasCodingChallenge = true;
            t.mock.method(config, 'get', (key) => {
                if (key === 'challenges.codingChallengesEnabled')
                    return 'never';
                return true;
            });
            challengeUtils.sendNotification(challenge, false);
            strict_1.default.equal(datacache.notifications[0].codingChallenge, false);
        });
    });
});
//# sourceMappingURL=challengeUtils.unit.test.js.map