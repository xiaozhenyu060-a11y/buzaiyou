"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDiffs = void 0;
exports.readFiles = readFiles;
exports.writeToFile = writeToFile;
exports.getDataFromFile = getDataFromFile;
exports.filterString = filterString;
exports.findChangedFiles = findChangedFiles;
exports.loadChallengeInfo = loadChallengeInfo;
exports.getFixExplanation = getFixExplanation;
exports.computeChallengeDiff = computeChallengeDiff;
const node_fs_1 = __importDefault(require("node:fs"));
const diff_1 = require("diff");
const js_yaml_1 = __importDefault(require("js-yaml"));
const vulnCodeSnippet_1 = require("../routes/vulnCodeSnippet");
const fixesPath = 'data/static/codefixes';
const cacheFile = 'rsn/cache.json';
function readFiles() {
    const files = node_fs_1.default.readdirSync(fixesPath);
    const keys = files.filter((file) => !file.endsWith('.info.yml') && !file.endsWith('.editorconfig'));
    return keys;
}
function writeToFile(json) {
    node_fs_1.default.writeFileSync(cacheFile, JSON.stringify(json, null, '\t'));
}
function getDataFromFile() {
    const data = node_fs_1.default.readFileSync(cacheFile).toString();
    return JSON.parse(data);
}
function filterString(text) {
    text = text.replace(/\r/g, '');
    return text;
}
const computeDiffs = async (keys) => {
    const data = keys.reduce((prev, curr) => {
        return {
            ...prev,
            [curr]: {
                added: [],
                removed: []
            }
        };
    }, {});
    for (const val of keys) {
        try {
            const snippet = await (0, vulnCodeSnippet_1.retrieveCodeSnippet)(val.split('_')[0]);
            if (snippet == null)
                continue;
            const fileData = node_fs_1.default.readFileSync(fixesPath + '/' + val).toString();
            const diff = (0, diff_1.diffLines)(filterString(fileData), filterString(snippet.snippet));
            let line = 0;
            for (const part of diff) {
                if (!part.count)
                    continue;
                if (part.removed)
                    continue;
                const prev = line;
                line += part.count;
                if (!part.added)
                    continue;
                for (let i = 0; i < part.count; i++) {
                    if (!snippet.vulnLines.includes(prev + i + 1) && !snippet.neutralLines.includes(prev + i + 1)) {
                        data[val].added.push(prev + i + 1);
                    }
                }
            }
            line = 0;
            let norm = 0;
            for (const part of diff) {
                if (!part.count)
                    continue;
                if (part.added) {
                    norm--;
                    continue;
                }
                const prev = line;
                line += part.count;
                if (!part.removed)
                    continue;
                let temp = norm;
                for (let i = 0; i < part.count; i++) {
                    if (!snippet.vulnLines.includes(prev + i + 1 - norm) && !snippet.neutralLines.includes(prev + i + 1 - norm)) {
                        data[val].removed.push(prev + i + 1 - norm);
                    }
                    temp++;
                }
                norm = temp;
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    return data;
};
exports.computeDiffs = computeDiffs;
function findChangedFiles(current, cached) {
    const changed = [];
    for (const key in current) {
        if (!cached[key]) {
            changed.push(key);
            continue;
        }
        const curAdded = [...current[key].added].sort((a, b) => a - b);
        const cacAdded = [...cached[key].added].sort((a, b) => a - b);
        const curRemoved = [...current[key].removed].sort((a, b) => a - b);
        const cacRemoved = [...cached[key].removed].sort((a, b) => a - b);
        if (curAdded.length !== cacAdded.length ||
            curRemoved.length !== cacRemoved.length ||
            !curAdded.every((val, i) => cacAdded[i] === val) ||
            !curRemoved.every((val, i) => cacRemoved[i] === val)) {
            changed.push(key);
        }
    }
    return changed;
}
function loadChallengeInfo(challengeName) {
    const infoPath = `${fixesPath}/${challengeName}.info.yml`;
    if (!node_fs_1.default.existsSync(infoPath))
        return null;
    const content = node_fs_1.default.readFileSync(infoPath, 'utf-8');
    return js_yaml_1.default.load(content);
}
function getFixExplanation(file, info) {
    if (!info)
        return null;
    const match = file.match(/_(\d+)/);
    if (!match)
        return null;
    const fixId = parseInt(match[1]);
    const fix = info.fixes.find(f => f.id === fixId);
    return fix?.explanation ?? null;
}
async function computeChallengeDiff(file) {
    const challengeName = file.split('_')[0];
    const info = loadChallengeInfo(challengeName);
    const explanation = getFixExplanation(file, info);
    const snippet = await (0, vulnCodeSnippet_1.retrieveCodeSnippet)(challengeName);
    if (!snippet)
        return null;
    const fileData = node_fs_1.default.readFileSync(fixesPath + '/' + file).toString();
    const patch = (0, diff_1.structuredPatch)(file, file, filterString(snippet.snippet), filterString(fileData));
    const lines = [];
    for (const hunk of patch.hunks) {
        for (const line of hunk.lines) {
            if (line[0] === '-') {
                lines.push({ type: 'removed', content: line });
            }
            else if (line[0] === '+') {
                lines.push({ type: 'added', content: line });
            }
            else {
                lines.push({ type: 'context', content: line });
            }
        }
    }
    return { file, challengeName, explanation, lines };
}
//# sourceMappingURL=rsnUtil.js.map