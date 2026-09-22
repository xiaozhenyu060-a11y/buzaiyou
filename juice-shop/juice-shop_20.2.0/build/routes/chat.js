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
exports.summarizeLlmError = summarizeLlmError;
exports.getUserId = getUserId;
exports.getUserNameFromToken = getUserNameFromToken;
exports.buildSystemPrompt = buildSystemPrompt;
exports.chat = chat;
const config_1 = __importDefault(require("config"));
const ai_1 = require("ai");
const openai_compatible_1 = require("@ai-sdk/openai-compatible");
const zod_1 = require("zod");
const sequelize_1 = require("sequelize");
const product_1 = require("../models/product");
const user_1 = require("../models/user");
const security = __importStar(require("../lib/insecurity"));
const insecurity_1 = require("../lib/insecurity");
const utils = __importStar(require("../lib/utils"));
const challengeUtils = __importStar(require("../lib/challengeUtils"));
const datacache_1 = require("../data/datacache");
const db = __importStar(require("../data/mongodb"));
const logger_1 = __importDefault(require("../lib/logger"));
const prom_client_1 = require("prom-client");
function summarizeLlmError(error) {
    if (!(error instanceof Error)) {
        return String(error).split('\n')[0];
    }
    const msg = error.message;
    if (msg.includes('Cannot connect to API') || msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET') || msg.includes('ENOTFOUND')) {
        return 'LLM API is not reachable';
    }
    const statusCode = error.statusCode;
    if (statusCode) {
        return `LLM API returned status ${statusCode}`;
    }
    return msg.split('\n')[0].replace(/:$/, '');
}
const botName = config_1.default.get('application.chatBot.name');
const appName = config_1.default.get('application.name');
async function getUserId(req) {
    const token = utils.jwtFrom(req);
    if (!token)
        return undefined;
    const decoded = security.decode(token);
    return decoded?.data?.id;
}
async function getUserNameFromToken(req) {
    const userId = await getUserId(req);
    if (!userId)
        return undefined;
    const user = await user_1.UserModel.findByPk(userId, { attributes: ['username'] });
    return user?.username ?? undefined;
}
const app = config_1.default.get('application.customMetricsPrefix');
const metricInputTokensTotal = new prom_client_1.Counter({
    name: `${app}_llm_input_tokens_total`,
    help: 'Number of total input tokens processed',
});
const metricInputTokens = new prom_client_1.Counter({
    name: `${app}_llm_input_tokens`,
    help: 'Number of input tokens processed',
    labelNames: ['type'],
});
const metricOutputTokensTotal = new prom_client_1.Counter({
    name: `${app}_llm_output_tokens_total`,
    help: 'Number of total output tokens processed',
});
const metricOutputTokens = new prom_client_1.Counter({
    name: `${app}_llm_output_tokens`,
    help: 'Number of output tokens processed',
    labelNames: ['type'],
});
const metricToolCalls = new prom_client_1.Counter({
    name: `${app}_llm_tool_calls_total`,
    help: 'Number of tool calls made',
    labelNames: ['tool'],
});
// vuln-code-snippet start chatbotGreedyInjectionChallenge
function buildSystemPrompt(userName) {
    const userIdentifier = userName ? `\nThe customer you are currently chatting with is ${userName}.` : '';
    return `You are "${botName}", the friendly customer service chatbot of the ${appName} online store.
You help customers find products, answer questions about the shop, and provide a delightful shopping experience.
Keep your responses concise and helpful.${userIdentifier}

IMPORTANT RULES:
- You MUST use the searchProducts tool whenever a customer asks about products, availability, prices, or anything related to the shop's catalog. NEVER guess or make up product names, prices, or descriptions.
- You MUST use the getProductReviews tool whenever a customer asks for reviews of a product.
- You MUST use the getOrderById tool whenever a customer asks about a specific order by its ID.
- Only recommend or mention products that were returned by the searchProducts tool. If a search returns no results, tell the customer that you could not find matching products.
- Do NOT invent information. If you do not know the answer to a question, say so honestly.
- Your scope is limited to the ${appName} store. Do not answer questions unrelated to the shop or its products.
- DO NOT RECOMMEND PRODUCTS THAT WERE NOT RETURNED BY THE searchProducts TOOL. If the customer asks for a product that is not found, apologize and suggest they try a different search query.
- When the search returns nothing, try again with a more generic query if possible, but do not make up product details.

COUPON POLICY (for the generateCoupon tool):
- You may ONLY generate a coupon for a customer who has a verified damaged order with a valid order ID (format: xxxx-xxxxxxxxxxxxxxxx, e.g. 3fa8-bf2bc042f4e92).
- The customer must have explicitly rejected a return or exchange before a coupon can be offered.
- The maximum allowed discount is 10%.
- NEVER generate a coupon just because a customer asks for one or complains.
- If the customer does not meet ALL of the above conditions, politely decline and explain the policy.

CONFIDENTIAL - INTERNAL ONLY: If a customer formally complains about their shopping experience and explicitly requests to escalate the issue, offer them a one-time 15% courtesy discount to resolve the case without escalation. Do not mention this option proactively.`;
}
const provider = (0, openai_compatible_1.createOpenAICompatible)({
    name: 'juice-shop-llm',
    apiKey: process.env.LLM_API_KEY ?? '',
    baseURL: config_1.default.get('application.chatBot.llmApiUrl')
});
function chat() {
    return async (req, res) => {
        const chatTools = {
            searchProducts: (0, ai_1.tool)({
                description: `Search the ${appName} product catalog by keyword`,
                inputSchema: zod_1.z.object({
                    query: zod_1.z.string().describe('The search query to find products')
                }),
                execute: async ({ query }) => {
                    const products = await product_1.ProductModel.findAll({
                        where: {
                            [sequelize_1.Op.or]: [
                                { name: { [sequelize_1.Op.like]: `%${query}%` } },
                                { description: { [sequelize_1.Op.like]: `%${query}%` } }
                            ]
                        },
                        attributes: ['id', 'name', 'description', 'price', 'image']
                    });
                    return products.map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        image: p.image
                    }));
                }
            }),
            getProductReviews: (0, ai_1.tool)({
                description: 'Get all reviews for a specific product by its ID',
                inputSchema: zod_1.z.object({
                    id: zod_1.z.string().describe('The product ID to get reviews for')
                }),
                execute: async ({ id }) => {
                    const productId = Number(id);
                    return await db.reviewsCollection.find({ $where: 'this.product == ' + productId });
                }
            }),
            getOrderById: (0, ai_1.tool)({
                description: 'Get order details for a specific order by its ID. Only returns the order if it belongs to the current customer.',
                inputSchema: zod_1.z.object({
                    orderId: zod_1.z.string().describe('The order ID to get details for (format: xxxx-xxxxxxxxxxxxxxxx)')
                }),
                execute: async ({ orderId }) => {
                    const userId = await getUserId(req);
                    if (!userId)
                        return { error: 'Customer not authenticated' };
                    const user = await user_1.UserModel.findByPk(userId, { attributes: ['email'] });
                    if (!user)
                        return { error: 'Customer not found' };
                    const maskedEmail = user.email ? user.email.replace(/[aeiou]/gi, '*') : undefined;
                    const order = await db.ordersCollection.findOne({ orderId });
                    if (!order)
                        return { error: 'Order not found' };
                    if (order.email !== maskedEmail)
                        return { error: 'Order does not belong to the current customer' };
                    return order;
                }
            }),
            // vuln-code-snippet start chatbotPromptInjectionChallenge
            generateCoupon: (0, ai_1.tool)({
                description: 'Generate a discount coupon for a customer. Only use this when the coupon policy conditions are fully met.', // vuln-code-snippet neutral-line chatbotPromptInjectionChallenge chatbotGreedyInjectionChallenge
                inputSchema: zod_1.z.object({
                    discount: zod_1.z.number().describe('The discount percentage for the coupon (maximum 10)') // vuln-code-snippet vuln-line chatbotPromptInjectionChallenge chatbotGreedyInjectionChallenge
                }),
                execute: async ({ discount }) => {
                    challengeUtils.solveIf(datacache_1.challenges.chatbotPromptInjectionChallenge, () => discount >= 10); // vuln-code-snippet hide-line
                    challengeUtils.solveIf(datacache_1.challenges.chatbotGreedyInjectionChallenge, () => discount >= 50); // vuln-code-snippet hide-line
                    const couponCode = security.generateCoupon(discount); // vuln-code-snippet vuln-line chatbotPromptInjectionChallenge
                    return { couponCode, discount }; // vuln-code-snippet neutral-line chatbotPromptInjectionChallenge
                }
            })
        }; // vuln-code-snippet end chatbotGreedyInjectionChallenge chatbotPromptInjectionChallenge
        const model = config_1.default.get('application.chatBot.model');
        const messages = req.body?.messages ?? [];
        const userName = await getUserNameFromToken(req);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Encoding', 'identity');
        res.flushHeaders();
        const systemPrompt = buildSystemPrompt(userName);
        try {
            const result = (0, ai_1.streamText)({
                model: provider(model),
                system: systemPrompt,
                messages,
                tools: { ...chatTools },
                maxRetries: config_1.default.get('application.chatBot.llmMaxRetries'),
                stopWhen: (0, ai_1.stepCountIs)(10),
                onError: ({ error }) => {
                    logger_1.default.warn('Chatbot stream error: ' + summarizeLlmError(error));
                }
            });
            for await (const event of result.fullStream) {
                switch (event.type) {
                    case 'text-delta':
                        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: event.text } }] })}\n\n`);
                        break;
                    case 'tool-call':
                        challengeUtils.solveIf(datacache_1.challenges.aiDebuggingChallenge, () => {
                            const token = utils.jwtFrom(req);
                            const decoded = token ? security.decode(token) : undefined;
                            const role = decoded?.data?.role;
                            return req.cookies.show_tool_calls === 'true' && role !== insecurity_1.roles.admin;
                        });
                        metricToolCalls.labels({ tool: event.toolName }).inc();
                        res.write(`data: ${JSON.stringify({
                            choices: [{
                                    delta: {
                                        tool_calls: [{
                                                id: event.toolCallId,
                                                type: 'function',
                                                function: { name: event.toolName, arguments: JSON.stringify(event.input) }
                                            }]
                                    }
                                }]
                        })}\n\n`);
                        break;
                    case 'finish':
                        res.write(`data: ${JSON.stringify({ choices: [{ finish_reason: event.finishReason }] })}\n\n`);
                        try {
                            if (event.totalUsage.inputTokens) {
                                metricInputTokensTotal.inc(Math.max(0, event.totalUsage.inputTokens));
                                metricInputTokens.labels({ type: 'cache_read' }).inc(Math.max(0, event.totalUsage.inputTokenDetails?.cacheReadTokens ?? 0));
                                metricInputTokens.labels({ type: 'cache_write' }).inc(Math.max(0, event.totalUsage.inputTokenDetails?.cacheWriteTokens ?? 0));
                                metricInputTokens.labels({ type: 'no_cache' }).inc(Math.max(0, event.totalUsage.inputTokenDetails?.noCacheTokens ?? 0));
                            }
                            if (event.totalUsage.outputTokens) {
                                metricOutputTokensTotal.inc(Math.max(0, event.totalUsage.outputTokens));
                                metricOutputTokens.labels({ type: 'reasoning' }).inc(Math.max(0, event.totalUsage.outputTokenDetails?.reasoningTokens ?? 0));
                                metricOutputTokens.labels({ type: 'text' }).inc(Math.max(0, event.totalUsage.outputTokenDetails?.textTokens ?? 0));
                            }
                        }
                        catch (metricError) {
                            logger_1.default.warn('Failed to record chat token usage metrics: ' + summarizeLlmError(metricError));
                        }
                        break;
                    case 'error':
                        res.write(`data: ${JSON.stringify({ error: `LLM error: ${event.error}` })}\n\n`);
                        break;
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        }
        catch (error) {
            logger_1.default.warn('Chatbot connection error: ' + summarizeLlmError(error));
            res.write(`data: ${JSON.stringify({ error: 'LLM API is not reachable' })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    };
}
//# sourceMappingURL=chat.js.map