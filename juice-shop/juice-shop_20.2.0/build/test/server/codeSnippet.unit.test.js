"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const vulnCodeSnippet_1 = require("../../routes/vulnCodeSnippet");
void (0, node_test_1.describe)('vulnCodeSnippet', () => {
    void (0, node_test_1.it)('should assert single correctly selected vuln line as correct', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1], [], [1]), true);
    });
    void (0, node_test_1.it)('should assert multiple correctly selected vuln lines as correct in any order', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], [1, 2]), true);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], [2, 1]), true);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2, 3], [], [3, 1, 2]), true);
    });
    void (0, node_test_1.it)('should ignore selected neutral lines during correct assertion', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3, 4], [1, 2, 3]), true);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3, 4], [1, 2, 4]), true);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3, 4], [1, 2, 3, 4]), true);
    });
    void (0, node_test_1.it)('should assert missing vuln lines as wrong', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], [1]), false);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], [2]), false);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3], [2, 3]), false);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3], [1, 3]), false);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3, 4], [3, 4]), false);
    });
    void (0, node_test_1.it)('should assert additionally selected lines as wrong', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], [1, 2, 3]), false);
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [3], [1, 2, 3, 4]), false);
    });
    void (0, node_test_1.it)('should assert lack of selected lines as wrong', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([1, 2], [], []), false);
    });
    void (0, node_test_1.it)('should assert empty edge case as correct', () => {
        strict_1.default.equal((0, vulnCodeSnippet_1.getVerdict)([], [], []), true);
    });
});
//# sourceMappingURL=codeSnippet.unit.test.js.map