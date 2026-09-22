"use strict";
// from https://github.com/jonschlinkert/is-windows MIT Licensed
// inlined to avoid import problems in cypress
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isWindows;
function isWindows() {
    return process && (process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE ?? ''));
}
//# sourceMappingURL=is-windows.js.map