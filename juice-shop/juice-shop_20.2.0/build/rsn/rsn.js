"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rsnUtil_1 = require("./rsnUtil");
const rsnOutput_1 = require("./rsnOutput");
async function main() {
    const keys = (0, rsnUtil_1.readFiles)();
    const currentData = await (0, rsnUtil_1.computeDiffs)(keys);
    const cachedData = (0, rsnUtil_1.getDataFromFile)();
    const changedFiles = (0, rsnUtil_1.findChangedFiles)(currentData, cachedData);
    if (changedFiles.length === 0) {
        (0, rsnOutput_1.printSuccess)();
    }
    else {
        (0, rsnOutput_1.printChangeSummary)(changedFiles.length);
        for (const file of changedFiles) {
            const diff = await (0, rsnUtil_1.computeChallengeDiff)(file);
            if (diff)
                (0, rsnOutput_1.printChallengeDiff)(diff);
        }
        (0, rsnOutput_1.printUpdateInstructions)();
        process.exitCode = 1;
    }
}
main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
//# sourceMappingURL=rsn.js.map