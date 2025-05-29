"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackModel = void 0;
const uuid_1 = require("uuid");
class StackModel {
    constructor(name, services = {}, networks, volumes, env) {
        this.id = (0, uuid_1.v4)();
        this.name = name;
        this.version = "3.8";
        this.services = this.enforceResourceLimits(services);
        this.networks = networks;
        this.volumes = volumes;
        this.env = env;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.status = "deploying";
    }
    /**
     * Enforces standardized resource limits on all services
     * All services get 1 CPU and 2GB RAM regardless of user input
     */
    enforceResourceLimits(services) {
        const standardResources = {
            limits: {
                cpus: "1.0",
                memory: "2G", // Fixed at 2GB RAM
            },
            reservations: {
                cpus: "0.25",
                memory: "512M", // Minimum 512MB RAM
            },
        };
        const processedServices = {};
        for (const [serviceName, service] of Object.entries(services)) {
            processedServices[serviceName] = Object.assign(Object.assign({}, service), { resources: standardResources });
        }
        return processedServices;
    }
    updateServices(services) {
        this.services = this.enforceResourceLimits(services);
        this.updatedAt = new Date();
    }
    updateStatus(status) {
        this.status = status;
        this.updatedAt = new Date();
    }
    /**
     * Returns standard resource limits for Docker service creation
     */
    static getStandardResourceLimits() {
        return {
            Limits: {
                NanoCPUs: 1000000000,
                MemoryBytes: 2147483648, // 2GB in bytes (2 * 1024 * 1024 * 1024)
            },
            Reservations: {
                NanoCPUs: 250000000,
                MemoryBytes: 536870912, // 512MB minimum (512 * 1024 * 1024)
            },
        };
    }
}
exports.StackModel = StackModel;
