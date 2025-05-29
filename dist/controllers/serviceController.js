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
exports.ServiceController = void 0;
const dockerService_1 = require("../services/dockerService");
class ServiceController {
    constructor() {
        this.dockerService = new dockerService_1.DockerService();
    }
    createService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const serviceData = req.body;
                const service = yield this.dockerService.createServiceAPI(serviceData);
                res.status(201).json(service);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    updateService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const serviceData = req.body;
                const updatedService = yield this.dockerService.updateServiceAPI(id, serviceData);
                res.status(200).json(updatedService);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    deleteService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield this.dockerService.deleteServiceAPI(id);
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    listServices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const services = yield this.dockerService.listServicesAPI();
                res.status(200).json(services);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.ServiceController = ServiceController;
