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
exports.DockerService = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
class DockerService {
    constructor() {
        this.docker = new dockerode_1.default();
    }
    createServiceAPI(serviceConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = yield this.docker.createService(serviceConfig);
                return service;
            }
            catch (error) {
                throw new Error(`Failed to create service: ${error.message}`);
            }
        });
    }
    updateServiceAPI(serviceId, updateConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = yield this.docker.getService(serviceId);
                yield service.update(updateConfig);
                return service;
            }
            catch (error) {
                throw new Error(`Failed to update service: ${error.message}`);
            }
        });
    }
    listServicesAPI() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield this.docker.listServices();
                return services;
            }
            catch (error) {
                throw new Error(`Failed to list services: ${error.message}`);
            }
        });
    }
    deleteServiceAPI(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = yield this.docker.getService(serviceId);
                yield service.remove();
            }
            catch (error) {
                throw new Error(`Failed to delete service: ${error.message}`);
            }
        });
    }
}
exports.DockerService = DockerService;
