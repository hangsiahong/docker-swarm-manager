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
exports.NetworkService = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
class NetworkService {
    constructor() {
        this.docker = new dockerode_1.default();
    }
    createNetworkIfNotExists(networkName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if network already exists
                const networks = yield this.docker.listNetworks({
                    filters: { name: [networkName] },
                });
                if (networks.length > 0) {
                    return networks[0];
                }
                // Create network if it doesn't exist
                const networkSpec = {
                    Name: networkName,
                    Driver: (options === null || options === void 0 ? void 0 : options.driver) || "overlay",
                    Attachable: (options === null || options === void 0 ? void 0 : options.attachable) || true,
                    Ingress: (options === null || options === void 0 ? void 0 : options.ingress) || false,
                    IPAM: (options === null || options === void 0 ? void 0 : options.ipam) || {},
                    EnableIPv6: (options === null || options === void 0 ? void 0 : options.enableIPv6) || false,
                    Options: (options === null || options === void 0 ? void 0 : options.options) || {},
                    Labels: (options === null || options === void 0 ? void 0 : options.labels) || {},
                };
                const network = yield this.docker.createNetwork(networkSpec);
                return yield network.inspect();
            }
            catch (error) {
                throw new Error(`Failed to create network: ${error.message}`);
            }
        });
    }
    listNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.docker.listNetworks();
            }
            catch (error) {
                throw new Error(`Failed to list networks: ${error.message}`);
            }
        });
    }
    getNetwork(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const network = this.docker.getNetwork(networkId);
                return yield network.inspect();
            }
            catch (error) {
                throw new Error(`Failed to get network: ${error.message}`);
            }
        });
    }
    removeNetwork(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const network = this.docker.getNetwork(networkId);
                yield network.remove();
            }
            catch (error) {
                throw new Error(`Failed to remove network: ${error.message}`);
            }
        });
    }
    getNetworkByName(networkName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const networks = yield this.docker.listNetworks({
                    filters: { name: [networkName] },
                });
                return networks.length > 0 ? networks[0] : null;
            }
            catch (error) {
                throw new Error(`Failed to get network by name: ${error.message}`);
            }
        });
    }
}
exports.NetworkService = NetworkService;
