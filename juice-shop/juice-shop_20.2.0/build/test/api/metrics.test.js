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
const supertest_1 = __importDefault(require("supertest"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const Prometheus = __importStar(require("prom-client"));
const config_1 = __importDefault(require("config"));
const setup_1 = require("./helpers/setup");
const metricsRoute = __importStar(require("../../routes/metrics"));
const datacache_1 = require("../../data/datacache");
let app;
(0, node_test_1.before)(async () => {
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
    // createTestApp calls Prometheus.register.clear() before configureApp, so custom metrics
    // are gone. Re-register them and wire up the /metrics route on the test app.
    const Metrics = metricsRoute.observeMetrics();
    metricsRoute.reRegisterMetrics(); // restore module-level counters cleared by register.clear()
    // The update loop fires after 5 s. Use mock timers to trigger one cycle immediately,
    // then restore real timers before the async DB work resolves.
    node_test_1.mock.timers.enable({ apis: ['setInterval'] });
    const loop = Metrics.updateLoop();
    node_test_1.mock.timers.tick(5000);
    clearInterval(loop);
    node_test_1.mock.timers.reset();
    // Poll until coding_challenges_progress has actual value lines (written after the
    // async Promise.all inside the update loop). Gauges appear in the registry immediately
    // on creation (as # HELP/# TYPE lines), but value lines only appear after .set() is called.
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        const text = await Prometheus.register.metrics();
        if (/juiceshop_coding_challenges_progress\{phase="find it"/.test(text))
            break;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}, { timeout: 60000 });
void (0, node_test_1.describe)('/metrics', () => {
    void (0, node_test_1.describe)('challenge tracking', () => {
        (0, node_test_1.before)(() => {
            datacache_1.challenges.exposedMetricsChallenge.solved = false;
        });
        void (0, node_test_1.it)('GET with an ignored scraper user agent does not solve exposedMetricsChallenge', async () => {
            const ignoredAgents = config_1.default.get('challenges.metricsIgnoredUserAgents');
            await (0, supertest_1.default)(app)
                .get('/metrics')
                .set('User-Agent', `${ignoredAgents[0]}/2.45.0`);
            strict_1.default.equal(datacache_1.challenges.exposedMetricsChallenge.solved, false);
        });
        void (0, node_test_1.it)('GET with a regular browser user agent solves exposedMetricsChallenge', async () => {
            await (0, supertest_1.default)(app)
                .get('/metrics')
                .set('User-Agent', 'Mozilla/5.0 (compatible; browser)');
            strict_1.default.equal(datacache_1.challenges.exposedMetricsChallenge.solved, true);
        });
    });
    void (0, node_test_1.describe)('response format', () => {
        void (0, node_test_1.it)('GET returns 200 with text/plain content type', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.equal(res.status, 200);
            strict_1.default.ok(res.headers['content-type']?.includes('text/plain'));
        });
    });
    void (0, node_test_1.describe)('update loop', { concurrency: 1 }, () => {
        void (0, node_test_1.it)('GET includes version info gauge after update loop runs', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^.*_version_info\{version="[0-9]+\.[0-9]+\.[0-9]+(-SNAPSHOT)?",major="[0-9]+",minor="[0-9]+",patch="[0-9]+",app=".*"\} 1$/m);
        });
        void (0, node_test_1.it)('GET includes per-difficulty and per-category challenge solved/total gauges', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^.*_challenges_solved\{difficulty="[1-6]",category=".+",app=".*"\} [0-9]+$/m);
            strict_1.default.match(res.text, /^.*_challenges_total\{difficulty="[1-6]",category=".+",app=".*"\} [0-9]+$/m);
        });
        void (0, node_test_1.it)('GET includes cheat score gauge', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^.*_cheat_score\{app=".*"\} [0-9.]+$/m);
        });
        void (0, node_test_1.it)('GET includes coding challenge progress gauges for all three phases', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^.*_coding_challenges_progress\{phase="find it",app=".*"\} [0-9]+$/m);
            strict_1.default.match(res.text, /^.*_coding_challenges_progress\{phase="fix it",app=".*"\} [0-9]+$/m);
            strict_1.default.match(res.text, /^.*_coding_challenges_progress\{phase="unsolved",app=".*"\} [0-9]+$/m);
        });
        void (0, node_test_1.it)('GET includes registered user counts from update loop', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^.*_users_registered_total\{app=".*"\} [0-9]+$/m);
        });
        void (0, node_test_1.it)('GET includes http request counter incremented by the request middleware', async () => {
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^http_requests_count\{status_code="2XX",app=".*"\} [0-9]+$/m);
        });
    });
    void (0, node_test_1.describe)('file upload metrics', () => {
        void (0, node_test_1.it)('GET includes file upload success counter after a valid upload', async () => {
            const file = node_path_1.default.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf');
            await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', node_fs_1.default.readFileSync(file), 'validSizeAndTypeForClient.pdf')
                .expect(204);
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^file_uploads_count\{file_type=".*",app=".*"\} [0-9]+$/m);
        });
        void (0, node_test_1.it)('GET includes file upload error counter after an upload that triggers a downstream error', async () => {
            // An XML file passes the multer size limit so req.file is set, but handleXmlUpload
            // sends a 410 response, which causes the onFinished callback to count it as an error.
            await (0, supertest_1.default)(app)
                .post('/file-upload')
                .attach('file', Buffer.from('<?xml version="1.0"?><root/>'), { filename: 'test.xml', contentType: 'application/xml' })
                .expect(410);
            const res = await (0, supertest_1.default)(app).get('/metrics');
            strict_1.default.match(res.text, /^file_upload_errors\{file_type=".*",app=".*"\} [0-9]+$/m);
        });
    });
});
//# sourceMappingURL=metrics.test.js.map