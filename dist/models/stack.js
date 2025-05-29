"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackModel = void 0;
const uuid_1 = require("uuid");
class StackModel {
    constructor(name, services = []) {
        this.id = (0, uuid_1.v4)();
        this.name = name;
        this.services = services;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    updateServices(services) {
        this.services = services;
        this.updatedAt = new Date();
    }
}
exports.StackModel = StackModel;
