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
const stack_1 = require("../models/stack");
const networkService_1 = require("./networkService");
class StackManager {
    constructor() {
        this.deployedStacks = new Map(); // In-memory storage for stack metadata
        this.dockerService = new dockerService_1.DockerService();
        this.networkService = new networkService_1.NetworkService();
    }
    /**
     * Create and deploy a new stack with multiple services
     * All services get fixed resource limits (1 CPU, 2GB RAM)
     */
    createStack(stackConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { name, services, networks, volumes, env } = stackConfig;
            if (!name || !services) {
                throw new Error("Stack name and services are required");
            }
            // Check if stack already exists
            if (this.deployedStacks.has(name)) {
                throw new Error(`Stack '${name}' already exists. Use updateStack to modify it.`);
            }
            // Create stack model with enforced resource limits
            const stack = new stack_1.StackModel(name, services, networks, volumes, env);
            try {
                // Create networks first
                if (networks) {
                    yield this.createStackNetworks(networks);
                }
                // Create volumes
                if (volumes) {
                    yield this.createStackVolumes(volumes);
                }
                // Deploy each service with fixed resource limits
                const deployedServices = [];
                for (const [serviceName, service] of Object.entries(stack.services)) {
                    const fullServiceName = `${name}_${serviceName}`;
                    try {
                        const serviceConfig = {
                            name: fullServiceName,
                            image: service.image,
                            replicas: ((_a = service.deploy) === null || _a === void 0 ? void 0 : _a.replicas) || service.replicas || 1,
                            ports: service.ports || [],
                            env: this.buildEnvironmentArray(service.environment, env),
                            labels: Object.assign(Object.assign({}, service.labels), { "com.docker.stack.namespace": name, "com.docker.stack.service": serviceName }),
                            networks: service.networks || [],
                            volumes: service.volumes || [],
                            // Resource limits are enforced by DockerService.createServiceAPI
                        };
                        yield this.dockerService.createServiceAPI(serviceConfig);
                        deployedServices.push(fullServiceName);
                    }
                    catch (error) {
                        // Rollback previously deployed services if one fails
                        yield this.rollbackServices(deployedServices);
                        throw new Error(`Failed to deploy service '${serviceName}': ${error.message}`);
                    }
                }
                stack.updateStatus("running");
                this.deployedStacks.set(name, stack);
                return stack;
            }
            catch (error) {
                stack.updateStatus("error");
                throw new Error(`Failed to deploy stack '${name}': ${error.message}`);
            }
        });
    }
    /**
     * Update an existing stack
     * Resource limits remain fixed during updates
     */
    updateStack(stackName, updateConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const existingStack = this.deployedStacks.get(stackName);
            if (!existingStack) {
                throw new Error(`Stack '${stackName}' not found`);
            }
            existingStack.updateStatus("updating");
            try {
                const { services, networks, volumes, env } = updateConfig;
                // Update networks if provided
                if (networks) {
                    yield this.updateStackNetworks(networks);
                }
                // Update volumes if provided
                if (volumes) {
                    yield this.updateStackVolumes(volumes);
                }
                // Update services with maintained resource limits
                if (services) {
                    for (const [serviceName, serviceUpdate] of Object.entries(services)) {
                        const fullServiceName = `${stackName}_${serviceName}`;
                        const updateData = {
                            image: serviceUpdate.image,
                            replicas: ((_a = serviceUpdate.deploy) === null || _a === void 0 ? void 0 : _a.replicas) ||
                                serviceUpdate.replicas,
                            env: this.buildEnvironmentArray(serviceUpdate.environment, env),
                            ports: serviceUpdate.ports,
                            networks: serviceUpdate.networks,
                            // Resource limits are enforced by DockerService.updateServiceAPI
                        };
                        yield this.dockerService.updateServiceAPI(fullServiceName, updateData);
                    }
                    // Update the stack model with enforced resource limits
                    existingStack.updateServices(services);
                }
                existingStack.updateStatus("running");
                this.deployedStacks.set(stackName, existingStack);
                return existingStack;
            }
            catch (error) {
                existingStack.updateStatus("error");
                throw new Error(`Failed to update stack '${stackName}': ${error.message}`);
            }
        });
    }
    /**
     * Delete a stack and all its services
     */
    deleteStack(stackName) {
        return __awaiter(this, void 0, void 0, function* () {
            const stack = this.deployedStacks.get(stackName);
            if (!stack) {
                throw new Error(`Stack '${stackName}' not found`);
            }
            try {
                // Delete all services in the stack
                for (const serviceName of Object.keys(stack.services)) {
                    const fullServiceName = `${stackName}_${serviceName}`;
                    try {
                        yield this.dockerService.deleteServiceAPI(fullServiceName);
                    }
                    catch (error) {
                        console.warn(`Failed to delete service '${fullServiceName}': ${error.message}`);
                    }
                }
                // Remove stack from memory
                this.deployedStacks.delete(stackName);
            }
            catch (error) {
                throw new Error(`Failed to delete stack '${stackName}': ${error.message}`);
            }
        });
    }
    /**
     * List all deployed stacks
     */
    listStacks() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(this.deployedStacks.values());
        });
    }
    /**
     * Get a specific stack by name
     */
    getStack(stackName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.deployedStacks.get(stackName) || null;
        });
    }
    /**
     * Scale a specific service within a stack
     * Resource limits per container remain fixed - only replica count changes
     */
    scaleStackService(stackName, serviceName, replicas) {
        return __awaiter(this, void 0, void 0, function* () {
            const stack = this.deployedStacks.get(stackName);
            if (!stack) {
                throw new Error(`Stack '${stackName}' not found`);
            }
            if (!stack.services[serviceName]) {
                throw new Error(`Service '${serviceName}' not found in stack '${stackName}'`);
            }
            const fullServiceName = `${stackName}_${serviceName}`;
            try {
                yield this.dockerService.scaleServiceAPI(fullServiceName, replicas);
                // Update the stack model
                stack.services[serviceName].replicas = replicas;
                if (stack.services[serviceName].deploy) {
                    stack.services[serviceName].deploy.replicas = replicas;
                }
                stack.updatedAt = new Date();
                this.deployedStacks.set(stackName, stack);
            }
            catch (error) {
                throw new Error(`Failed to scale service '${serviceName}' in stack '${stackName}': ${error.message}`);
            }
        });
    }
    /**
     * Get all services within a stack
     */
    getStackServices(stackName) {
        return __awaiter(this, void 0, void 0, function* () {
            const stack = this.deployedStacks.get(stackName);
            if (!stack) {
                throw new Error(`Stack '${stackName}' not found`);
            }
            const services = [];
            for (const serviceName of Object.keys(stack.services)) {
                const fullServiceName = `${stackName}_${serviceName}`;
                try {
                    const service = yield this.dockerService.getServiceAPI(fullServiceName);
                    services.push(service);
                }
                catch (error) {
                    console.warn(`Failed to get service '${fullServiceName}': ${error.message}`);
                }
            }
            return services;
        });
    }
    /**
     * Get logs for all services in a stack or a specific service
     */
    getStackLogs(stackName, serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const stack = this.deployedStacks.get(stackName);
            if (!stack) {
                throw new Error(`Stack '${stackName}' not found`);
            }
            if (serviceName) {
                if (!stack.services[serviceName]) {
                    throw new Error(`Service '${serviceName}' not found in stack '${stackName}'`);
                }
                const fullServiceName = `${stackName}_${serviceName}`;
                return yield this.dockerService.getServiceLogsAPI(fullServiceName);
            }
            // Get logs from all services
            const logs = {};
            for (const serviceName of Object.keys(stack.services)) {
                const fullServiceName = `${stackName}_${serviceName}`;
                try {
                    logs[serviceName] = yield this.dockerService.getServiceLogsAPI(fullServiceName);
                }
                catch (error) {
                    logs[serviceName] = { error: error.message };
                }
            }
            return logs;
        });
    }
    /**
     * Create networks for the stack
     */
    createStackNetworks(networks) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [networkName, networkConfig] of Object.entries(networks)) {
                try {
                    yield this.networkService.createNetworkIfNotExists(networkName, Object.assign({ driver: networkConfig.driver || "overlay", attachable: networkConfig.attachable || true }, networkConfig));
                }
                catch (error) {
                    console.warn(`Failed to create network '${networkName}': ${error.message}`);
                }
            }
        });
    }
    /**
     * Update networks for the stack
     */
    updateStackNetworks(networks) {
        return __awaiter(this, void 0, void 0, function* () {
            // For now, we just ensure networks exist
            yield this.createStackNetworks(networks);
        });
    }
    /**
     * Create volumes for the stack
     */
    createStackVolumes(volumes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Volume creation would be implemented here
            // For now, just log the volumes that would be created
            for (const [volumeName, volumeConfig] of Object.entries(volumes)) {
                console.log(`Volume '${volumeName}' would be created with config:`, volumeConfig);
            }
        });
    }
    /**
     * Update volumes for the stack
     */
    updateStackVolumes(volumes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Volume updates would be implemented here
            yield this.createStackVolumes(volumes);
        });
    }
    /**
     * Build environment array from service env and stack env
     */
    buildEnvironmentArray(serviceEnv, stackEnv) {
        const env = [];
        // Add stack-level environment variables
        if (stackEnv) {
            for (const [key, value] of Object.entries(stackEnv)) {
                env.push(`${key}=${value}`);
            }
        }
        // Add service-level environment variables (these override stack-level)
        if (serviceEnv) {
            env.push(...serviceEnv);
        }
        return env;
    }
    /**
     * Rollback deployed services in case of failure
     */
    rollbackServices(serviceNames) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const serviceName of serviceNames) {
                try {
                    yield this.dockerService.deleteServiceAPI(serviceName);
                }
                catch (error) {
                    console.warn(`Failed to rollback service '${serviceName}': ${error.message}`);
                }
            }
        });
    }
}
exports.default = StackManager;
