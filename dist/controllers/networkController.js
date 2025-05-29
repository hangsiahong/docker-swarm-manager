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
exports.NetworkController = void 0;
const networkService_1 = require("../services/networkService");
const logger_1 = __importDefault(require("../utils/logger"));
class NetworkController {
    constructor() {
        this.networkService = new networkService_1.NetworkService();
    }
    createNetwork(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, driver = "overlay", attachable = true, options = {}, } = req.body;
                if (!name) {
                    res.status(400).json({ error: "Network name is required" });
                    return;
                }
                const networkConfig = Object.assign({ driver,
                    attachable,
                    options }, req.body);
                const network = yield this.networkService.createNetworkIfNotExists(name, networkConfig);
                logger_1.default.info(`Network ${name} created successfully`);
                res
                    .status(201)
                    .json({ message: "Network created successfully", network });
            }
            catch (error) {
                logger_1.default.error(`Failed to create network: ${error.message}`);
                res
                    .status(500)
                    .json({ message: `Failed to create network: ${error.message}` });
            }
        });
    }
    listNetworks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const networks = yield this.networkService.listNetworks();
                res.json(networks);
            }
            catch (error) {
                logger_1.default.error(`Failed to list networks: ${error.message}`);
                res
                    .status(500)
                    .json({ message: `Failed to list networks: ${error.message}` });
            }
        });
    }
    getNetwork(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const network = yield this.networkService.getNetwork(id);
                res.json(network);
            }
            catch (error) {
                logger_1.default.error(`Failed to get network: ${error.message}`);
                res
                    .status(500)
                    .json({ message: `Failed to get network: ${error.message}` });
            }
        });
    }
    deleteNetwork(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield this.networkService.removeNetwork(id);
                logger_1.default.info(`Network ${id} deleted successfully`);
                res.json({ message: "Network deleted successfully" });
            }
            catch (error) {
                logger_1.default.error(`Failed to delete network: ${error.message}`);
                res
                    .status(500)
                    .json({ message: `Failed to delete network: ${error.message}` });
            }
        });
    }
}
exports.NetworkController = NetworkController;
