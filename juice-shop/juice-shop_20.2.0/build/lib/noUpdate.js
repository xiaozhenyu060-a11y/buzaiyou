"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeKeyNonUpdatable = void 0;
const errors_1 = require("sequelize/lib/errors");
const makeKeyNonUpdatable = (model, column) => {
    model.addHook('beforeValidate', (instance, options) => {
        if (!options.validate)
            return;
        if (instance.isNewRecord)
            return;
        const changedKeys = [];
        const instanceChanged = Array.from(instance._changed);
        instanceChanged.forEach((value) => changedKeys.push(value));
        if (changedKeys.length === 0)
            return;
        const validationErrors = [];
        changedKeys.forEach((fieldName) => {
            const fieldDefinition = instance.rawAttributes[fieldName];
            if (instance._previousDataValues[fieldName] !== undefined &&
                instance._previousDataValues[fieldName] !== null &&
                (fieldDefinition.fieldName === column)) {
                validationErrors.push(new errors_1.ValidationErrorItem(`\`${fieldName}\` cannot be updated due \`noUpdate\` constraint`, null, // null type + null origin → "null: msg" in ValidationError.message
                fieldName, '', instance, 'noUpdate', '', []));
            }
        });
        if (validationErrors.length > 0) {
            throw new errors_1.ValidationError('', validationErrors);
        }
    });
};
exports.makeKeyNonUpdatable = makeKeyNonUpdatable;
//# sourceMappingURL=noUpdate.js.map