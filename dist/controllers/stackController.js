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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackController = void 0;
const stackManager_1 = __importDefault(require("../services/stackManager"));
class StackController {
    constructor() {
        this.stackManager = new stackManager_1.default();
    }
    createStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackData = req.body;
                const stack = yield this.stackManager.createStack(stackData);
                res.status(201).json(stack);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    updateStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackId = req.params.id;
                const stackData = req.body;
                const updatedStack = yield this.stackManager.updateStack(stackId, stackData);
                res.status(200).json(updatedStack);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    deleteStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackId = req.params.id;
                yield this.stackManager.deleteStack(stackId);
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    listStacks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stacks = yield this.stackManager.listStacks();
                res.status(200).json(stacks);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    getStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackId = req.params.id;
                const stack = yield this.stackManager.getStack(stackId);
                if (!stack) {
                    res.status(404).json({ message: "Stack not found" });
                    return;
                }
                res.status(200).json(stack);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.StackController = StackController;
