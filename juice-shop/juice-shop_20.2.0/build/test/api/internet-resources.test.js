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
void (0, node_test_1.describe)('Required Internet resource', () => {
    void (0, node_test_1.describe)('PasteBin paste for "Leaked Unsafe Product" challenge available', () => {
        void (0, node_test_1.it)('for default configuration (https://pastebin.com/90dUgd7s)', async () => {
            const res = await fetch('https://pastebin.com/90dUgd7s');
            const body = await res.text();
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(body.includes('Hueteroneel'));
            strict_1.default.ok(body.includes('this coupled with Eurogium Edule was sometimes found fatal'));
        });
        void (0, node_test_1.it)('for 7MS configuration (https://pastebin.com/8SMbWPxc)', async () => {
            const res = await fetch('https://pastebin.com/8SMbWPxc');
            const body = await res.text();
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(body.includes('TAYLOR SWIFT'));
            strict_1.default.ok(body.includes('KATY PERRY'));
            strict_1.default.ok(body.includes('(Consider rivalries when picking song list for events as wrong combo could infuriate a mixed-fans audience, see https://www.nickiswift.com/2075/taylor-swifts-list-enemies)'));
        });
        void (0, node_test_1.it)('for BodgeIt Store configuration (https://pastebin.com/G47LrDr0)', async () => {
            const res = await fetch('https://pastebin.com/G47LrDr0');
            const body = await res.text();
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(body.includes('Mind Blank - one willing creature you touch is immune any effect'));
            strict_1.default.ok(body.includes('They should seek out a Couatl, and undertake a quest to receive'));
            strict_1.default.ok(body.includes('They could acquire the aid of a rakshasa, and willingly invoke its'));
            strict_1.default.ok(body.includes('Note to self: Option (1) and (3) of the above should not be combined.'));
        });
        void (0, node_test_1.it)('for Mozilla configuration (https://pastebin.com/t8jqE1y7)', async () => {
            const res = await fetch('https://pastebin.com/t8jqE1y7');
            const body = await res.text();
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(body.includes('Fixed a bug that, when this plugin was installed together with both the'));
            strict_1.default.ok(body.includes('JuiceNote'));
            strict_1.default.ok(body.includes('Magische Firefox Suche'));
            strict_1.default.ok(body.includes('plugins, lwt your browser throw a'));
            strict_1.default.ok(body.includes('JuiceOverFlowError'));
            strict_1.default.ok(body.includes('The problem can still occur post-fix but at least now less frequently!'));
        });
        void (0, node_test_1.it)('for All Day DevOps configuration (https://pastebin.com/RXrihEMS)', async () => {
            const res = await fetch('https://pastebin.com/RXrihEMS');
            const body = await res.text();
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(body.includes('The infamous 301 and 303 lasers.'));
            strict_1.default.ok(body.includes('Cheap Chinese crap with no quality control'));
            strict_1.default.ok(body.includes('permanent damage before you can blink your eye'));
        });
    });
    void (0, node_test_1.it)('Comment on "Top 10 Fruits you probably dont know" blog post with PasteBin paste URL spoiler available', async () => {
        const res = await fetch('https://listverse.disqus.com/top_20_fruits_you_probably_don039t_know/latest.rss');
        const body = await res.text();
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(body.includes('Rippertuer Special Juice'));
        strict_1.default.ok(body.includes('https://pastebin.com/90dUgd7s'));
    });
    void (0, node_test_1.it)('PasteBin paste (https://pastebin.com/4U1V1UjU) for "Leaked Access Logs" challenge available', async () => {
        const res = await fetch('https://pastebin.com/4U1V1UjU');
        const body = await res.text();
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(body.includes('current=0Y8rMnww$*9VFYE%C2%A759-!Fg1L6t&amp;6lB'));
    });
    void (0, node_test_1.it)('StackOverflow question "Less verbose access logs using expressjs/morgan" with log snippet and PasteBin paste URL spoiler available', { skip: 'FIXME StackOverflow blocking with 403 error' }, async () => {
        const res = await fetch('https://stackoverflow.com/questions/57061271/less-verbose-access-logs-using-expressjs-morgan');
        const body = await res.text();
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(body.includes('/rest/continue-code'));
        strict_1.default.ok(body.includes('/api/Challenges/?name=Score%20Board'));
        strict_1.default.ok(body.includes('https://pastebin.com/4U1V1UjU'));
    });
    void (0, node_test_1.it)('GitHub issue (https://github.com/apostrophecms/sanitize-html/issues/29) for "Server-side XSS Protection" challenge available', async () => {
        const res = await fetch('https://github.com/apostrophecms/sanitize-html/issues/29');
        const body = await res.text();
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(body.includes('Sanitization is not applied recursively'));
        strict_1.default.ok(body.includes('I am not harmless: &lt;&lt;img src=&quot;csrf-attack&quot;/&gt;img src=&quot;csrf-attack&quot;/&gt; is sanitized to I am not harmless: &lt;img src=&quot;csrf-attack&quot;/&gt;'));
    });
});
//# sourceMappingURL=internet-resources.test.js.map