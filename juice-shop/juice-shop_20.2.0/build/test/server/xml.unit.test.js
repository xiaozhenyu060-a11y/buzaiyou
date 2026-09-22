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
const xml_1 = require("../../lib/xml");
void (0, node_test_1.describe)('xml', () => {
    void (0, node_test_1.it)('should parse a simple XML string', async () => {
        const xml = '<?xml version="1.0" encoding="UTF-8"?><root>hello</root>';
        const result = await (0, xml_1.parseXmlString)(xml);
        strict_1.default.match(result, /<root>hello<\/root>/);
    });
    void (0, node_test_1.it)('should expand internal entities', async () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
  <!ENTITY hello "world">
]>
<root>&hello;</root>`;
        const result = await (0, xml_1.parseXmlString)(xml);
        strict_1.default.match(result, /<root>world<\/root>/);
    });
    void (0, node_test_1.it)('should throw error on malformed XML', async () => {
        const xml = '<root>unclosed';
        await strict_1.default.rejects(async () => {
            await (0, xml_1.parseXmlString)(xml);
        });
    });
    void (0, node_test_1.it)('should timeout on entity expansion bomb', async () => {
        const xml = `<?xml version="1.0"?>
<!DOCTYPE lolz [
 <!ENTITY lol "lol">
 <!ELEMENT lolz (#PCDATA)>
 <!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
 <!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">
 <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
 <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
 <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
 <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
 <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
 <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
 <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<lolz>&lol9;</lolz>`;
        // This might trigger either the libxml2 amplification protection or the VM timeout
        await strict_1.default.rejects(async () => {
            await (0, xml_1.parseXmlString)(xml, 100); // 100ms timeout
        }, /(Script execution timed out|Maximum entity amplification factor exceeded)/);
    });
});
//# sourceMappingURL=xml.unit.test.js.map