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
const http = __importStar(require("http"));
const setup_1 = require("./helpers/setup");
const auth_1 = require("./helpers/auth");
const MOCK_LLM_PORT = 43210;
let app;
let mockServer;
let onLlmRequest = (_req, _body, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
};
function sseData(obj) {
    return `data: ${JSON.stringify(obj)}\n\n`;
}
function contentChunk(content) {
    return {
        id: 'chatcmpl-test',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'test-model',
        choices: [{ index: 0, delta: { content }, finish_reason: null }]
    };
}
function toolCallChunk(id, name, args) {
    return {
        id: 'chatcmpl-test',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'test-model',
        choices: [{
                index: 0,
                delta: {
                    tool_calls: [{ index: 0, id, type: 'function', function: { name, arguments: args } }]
                },
                finish_reason: null
            }]
    };
}
function finishChunk(reason = 'stop') {
    return {
        id: 'chatcmpl-test',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'test-model',
        choices: [{ index: 0, delta: {}, finish_reason: reason }]
    };
}
function sendSSE(res, chunks) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'close'
    });
    for (const chunk of chunks) {
        res.write(sseData(chunk));
    }
    res.write('data: [DONE]\n\n');
    res.end();
}
(0, node_test_1.before)(async () => {
    await new Promise((resolve) => {
        mockServer = http.createServer((req, res) => {
            // Prevent keep-alive: each response closes the connection so the AI SDK's
            // connection pool does not retain sockets that could outlive the test suite.
            res.setHeader('Connection', 'close');
            let body = '';
            req.on('data', (chunk) => { body += chunk.toString(); });
            req.on('end', () => {
                // Startup precondition checks (validatePreconditions) probe `/v1` and
                // `/v1/models` with GET requests. Don't route those through onLlmRequest,
                // which would call JSON.parse('') on the empty body and throw.
                if (req.method !== 'POST' || !(req.url?.includes('chat/completions') ?? false)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end('{"data":[]}');
                    return;
                }
                onLlmRequest(req, body, res);
            });
        });
        mockServer.keepAliveTimeout = 0;
        mockServer.listen(MOCK_LLM_PORT, resolve);
    });
    const result = await (0, setup_1.createTestApp)();
    app = result.app;
}, { timeout: 60000 });
(0, node_test_1.after)(async () => {
    await new Promise((resolve) => {
        if (!mockServer?.listening) {
            resolve();
            return;
        }
        // Destroy all open sockets immediately so req.on('end') callbacks from
        // lingering keep-alive connections cannot fire after the suite ends and
        // produce uncaught SyntaxError exceptions from JSON.parse('').
        mockServer.closeAllConnections();
        mockServer.close(() => { resolve(); });
    });
});
void (0, node_test_1.describe)('/rest/chat', { timeout: 120000 }, () => {
    void (0, node_test_1.it)('POST returns streamed text content as SSE events', { timeout: 15000 }, async () => {
        onLlmRequest = (_req, _body, res) => {
            sendSSE(res, [
                contentChunk('Hello'),
                contentChunk(' there!'),
                finishChunk()
            ]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Hi' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/event-stream'));
        strict_1.default.ok(res.text.includes('Hello'));
        strict_1.default.ok(res.text.includes(' there!'));
        strict_1.default.ok(res.text.includes('data: [DONE]'));
    });
    void (0, node_test_1.it)('POST sets correct SSE response headers', { timeout: 15000 }, async () => {
        onLlmRequest = (_req, _body, res) => {
            sendSSE(res, [contentChunk('Hi'), finishChunk()]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Hello' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.headers['content-type']?.includes('text/event-stream'));
        strict_1.default.ok(res.headers['cache-control']?.includes('no-cache'));
    });
    void (0, node_test_1.it)('POST includes system prompt and user messages in LLM request', { timeout: 15000 }, async () => {
        let parsedBody;
        onLlmRequest = (_req, body, res) => {
            parsedBody = JSON.parse(body);
            sendSSE(res, [contentChunk('I am Juicy!'), finishChunk()]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'What is your name?' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(parsedBody.messages[0].role, 'system');
        strict_1.default.ok(parsedBody.messages[0].content.includes('Juicy'));
        strict_1.default.equal(parsedBody.messages[1].role, 'user');
        strict_1.default.equal(parsedBody.messages[1].content, 'What is your name?');
    });
    void (0, node_test_1.it)('POST sends searchProducts tool definition to LLM', { timeout: 15000 }, async () => {
        let parsedBody;
        onLlmRequest = (_req, body, res) => {
            parsedBody = JSON.parse(body);
            sendSSE(res, [contentChunk('We have many products!'), finishChunk()]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'What products do you have?' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(parsedBody.tools);
        strict_1.default.equal(parsedBody.tools.length, 4);
        const toolNames = parsedBody.tools.map((t) => t.function.name);
        strict_1.default.ok(toolNames.includes('searchProducts'));
        strict_1.default.ok(toolNames.includes('generateCoupon'));
        strict_1.default.ok(toolNames.includes('getOrderById'));
    });
    void (0, node_test_1.it)('POST handles searchProducts tool call and returns follow-up response', { timeout: 15000 }, async () => {
        let callCount = 0;
        onLlmRequest = (_req, body, res) => {
            callCount++;
            if (callCount === 1) {
                sendSSE(res, [
                    toolCallChunk('call_abc', 'searchProducts', '{"query":"apple"}'),
                    finishChunk('tool_calls')
                ]);
            }
            else {
                const parsed = JSON.parse(body);
                const toolMsg = parsed.messages.find((m) => m.role === 'tool');
                strict_1.default.ok(toolMsg);
                strict_1.default.equal(toolMsg.tool_call_id, 'call_abc');
                strict_1.default.ok(toolMsg.content.includes('Apple Juice'));
                sendSSE(res, [
                    contentChunk('We have Apple Juice (1000ml) for $1.99!'),
                    finishChunk()
                ]);
            }
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Do you have apple juice?' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('Apple Juice'));
        strict_1.default.ok(res.text.includes('data: [DONE]'));
    });
    void (0, node_test_1.it)('POST handles LLM API error gracefully', { timeout: 15000 }, async () => {
        onLlmRequest = (_req, _body, res) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: 'Internal server error' } }));
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Hi' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('error'));
        strict_1.default.ok(res.text.includes('data: [DONE]'));
    });
    void (0, node_test_1.it)('POST with empty messages returns error SSE stream', { timeout: 15000 }, async () => {
        onLlmRequest = (_req, _body, res) => {
            sendSSE(res, [
                contentChunk('How can I help you?'),
                finishChunk()
            ]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.text.includes('error'));
        strict_1.default.ok(res.text.includes('data: [DONE]'));
    });
    void (0, node_test_1.it)('POST includes authenticated user name in system prompt', { timeout: 15000 }, async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'bjoern.kimminich@gmail.com', password: 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=' });
        let parsedBody;
        onLlmRequest = (_req, body, res) => {
            parsedBody = JSON.parse(body);
            sendSSE(res, [contentChunk('Hi!'), finishChunk()]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json', Authorization: 'Bearer ' + token })
            .send({ messages: [{ role: 'user', content: 'Hi' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(parsedBody.messages[0].content.includes('bkimminich'));
    });
    void (0, node_test_1.it)('POST handles getProductReviews tool call by returning matching reviews', { timeout: 15000 }, async () => {
        let toolResult;
        let callCount = 0;
        onLlmRequest = (_req, body, res) => {
            callCount++;
            if (callCount === 1) {
                sendSSE(res, [
                    toolCallChunk('call_rev', 'getProductReviews', '{"id":"1"}'),
                    finishChunk('tool_calls')
                ]);
            }
            else {
                const parsed = JSON.parse(body);
                toolResult = parsed.messages.find((m) => m.role === 'tool')?.content;
                sendSSE(res, [contentChunk('Here are the reviews.'), finishChunk()]);
            }
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Show me reviews for product 1' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(toolResult !== undefined);
    });
    void (0, node_test_1.it)('POST handles getOrderById tool call by reporting unauthenticated customer', { timeout: 15000 }, async () => {
        let toolResult;
        let callCount = 0;
        onLlmRequest = (_req, body, res) => {
            callCount++;
            if (callCount === 1) {
                sendSSE(res, [
                    toolCallChunk('call_ord', 'getOrderById', '{"orderId":"abcd-0123456789abcdef"}'),
                    finishChunk('tool_calls')
                ]);
            }
            else {
                const parsed = JSON.parse(body);
                toolResult = parsed.messages.find((m) => m.role === 'tool')?.content;
                sendSSE(res, [contentChunk('Done.'), finishChunk()]);
            }
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Look up my order' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(toolResult?.includes('Customer not authenticated'));
    });
    void (0, node_test_1.it)('POST handles getOrderById tool call by reporting order not found for authenticated customer', { timeout: 15000 }, async () => {
        const { token } = await (0, auth_1.login)(app, { email: 'jim@juice-sh.op', password: 'ncc-1701' });
        let toolResult;
        let callCount = 0;
        onLlmRequest = (_req, body, res) => {
            callCount++;
            if (callCount === 1) {
                sendSSE(res, [
                    toolCallChunk('call_ord2', 'getOrderById', '{"orderId":"abcd-9999999999999999"}'),
                    finishChunk('tool_calls')
                ]);
            }
            else {
                const parsed = JSON.parse(body);
                toolResult = parsed.messages.find((m) => m.role === 'tool')?.content;
                sendSSE(res, [contentChunk('Done.'), finishChunk()]);
            }
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json', Authorization: 'Bearer ' + token })
            .send({ messages: [{ role: 'user', content: 'Look up my order' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(toolResult?.includes('Order not found'));
    });
    void (0, node_test_1.it)('POST handles generateCoupon tool call and includes coupon code in tool response', { timeout: 15000 }, async () => {
        let toolResult;
        let callCount = 0;
        onLlmRequest = (_req, body, res) => {
            callCount++;
            if (callCount === 1) {
                sendSSE(res, [
                    toolCallChunk('call_cpn', 'generateCoupon', '{"discount":5}'),
                    finishChunk('tool_calls')
                ]);
            }
            else {
                const parsed = JSON.parse(body);
                toolResult = parsed.messages.find((m) => m.role === 'tool')?.content;
                sendSSE(res, [contentChunk('Here is your coupon.'), finishChunk()]);
            }
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Give me a coupon' }] });
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(toolResult);
        const parsed = JSON.parse(toolResult);
        strict_1.default.equal(parsed.discount, 5);
        strict_1.default.ok(parsed.couponCode !== undefined);
    });
    void (0, node_test_1.it)('POST response SSE data lines contain valid JSON', { timeout: 15000 }, async () => {
        onLlmRequest = (_req, _body, res) => {
            sendSSE(res, [
                contentChunk('Test message'),
                finishChunk()
            ]);
        };
        const res = await (0, supertest_1.default)(app)
            .post('/rest/chat')
            .set({ 'content-type': 'application/json' })
            .send({ messages: [{ role: 'user', content: 'Test' }] });
        strict_1.default.equal(res.status, 200);
        const dataLines = res.text.split('\n').filter((l) => l.startsWith('data: '));
        strict_1.default.ok(dataLines.length >= 2);
        for (const line of dataLines) {
            const data = line.slice(6);
            if (data === '[DONE]')
                continue;
            const parsed = JSON.parse(data);
            strict_1.default.ok(parsed.choices);
            if (parsed.choices[0].finish_reason)
                continue;
            strict_1.default.ok(parsed.choices[0].delta);
        }
    });
});
//# sourceMappingURL=chat.test.js.map