"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMemory = addMemory;
exports.getMemories = getMemories;
const memory_1 = require("../models/memory");
const user_1 = require("../models/user");
function addMemory() {
    return async (req, res, next) => {
        const record = {
            caption: req.body.caption,
            imagePath: 'assets/public/images/uploads/' + req.file?.filename,
            UserId: req.body.UserId
        };
        const memory = await memory_1.MemoryModel.create(record);
        res.status(200).json({ status: 'success', data: memory });
    };
}
function getMemories() {
    return async (req, res, next) => {
        const memories = await memory_1.MemoryModel.findAll({ include: [user_1.UserModel] });
        res.status(200).json({ status: 'success', data: memories });
    };
}
//# sourceMappingURL=memory.js.map