"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dockerService_1 = require("./dockerService");
class StackManager {
    constructor() {
        this.dockerService = new dockerService_1.DockerService();
    }
    createStack(stack) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dockerService.createServiceAPI(stack);
        });
    }
    updateStack(serviceId, stackData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dockerService.updateServiceAPI(serviceId, stackData);
        });
    }
    deleteStack(stackId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dockerService.deleteServiceAPI(stackId);
        });
    }
    listStacks() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dockerService.listServicesAPI();
        });
    }
    getStack(stackId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stacks = yield this.dockerService.listServicesAPI();
            return stacks.find((stack) => stack.Id === stackId) || null;
        });
    }
}
exports.default = StackManager;
