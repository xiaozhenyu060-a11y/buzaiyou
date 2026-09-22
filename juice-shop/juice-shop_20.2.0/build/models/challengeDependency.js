"use strict";
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeDependencyModelInit = exports.ChallengeDependencyModel = void 0;
const sequelize_1 = require("sequelize");
class ChallengeDependency extends sequelize_1.Model {
}
exports.ChallengeDependencyModel = ChallengeDependency;
const ChallengeDependencyModelInit = (sequelize) => {
    ChallengeDependency.init({
        ChallengeId: {
            type: sequelize_1.DataTypes.INTEGER
        },
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING
        },
        documentation: {
            type: sequelize_1.DataTypes.STRING
        },
        key: {
            type: sequelize_1.DataTypes.STRING
        },
        missing: {
            type: sequelize_1.DataTypes.BOOLEAN
        }
    }, {
        tableName: 'ChallengeDependencies',
        sequelize
    });
};
exports.ChallengeDependencyModelInit = ChallengeDependencyModelInit;
//# sourceMappingURL=challengeDependency.js.map