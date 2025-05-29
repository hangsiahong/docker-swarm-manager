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
    /**
     * Create and deploy a new stack with enforced resource limits
     * POST /api/stacks
     */
    createStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackData = req.body;
                const stack = yield this.stackManager.createStack(stackData);
                res.status(201).json({
                    message: `Stack '${stack.name}' deployed successfully with fixed resource limits (1 CPU, 2GB RAM per service)`,
                    stack: {
                        id: stack.id,
                        name: stack.name,
                        status: stack.status,
                        services: Object.keys(stack.services).length,
                        resourcePolicy: "Fixed: 1 CPU, 2GB RAM per container. Scale with replicas, not resources.",
                        createdAt: stack.createdAt,
                    },
                });
            }
            catch (error) {
                res.status(400).json({
                    message: error.message,
                    resourcePolicy: "All services are limited to 1 CPU and 2GB RAM. Scale by increasing replicas.",
                });
            }
        });
    }
    /**
     * Update an existing stack while maintaining resource limits
     * PUT /api/stacks/:name
     */
    updateStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name || req.params.id; // Support both :name and :id
                const stackData = req.body;
                const updatedStack = yield this.stackManager.updateStack(stackName, stackData);
                res.status(200).json({
                    message: `Stack '${updatedStack.name}' updated successfully with maintained resource limits`,
                    stack: {
                        id: updatedStack.id,
                        name: updatedStack.name,
                        status: updatedStack.status,
                        services: Object.keys(updatedStack.services).length,
                        resourcePolicy: "Fixed: 1 CPU, 2GB RAM per container. Resource limits cannot be changed.",
                        updatedAt: updatedStack.updatedAt,
                    },
                });
            }
            catch (error) {
                res.status(400).json({
                    message: error.message,
                    resourcePolicy: "Resource limits are fixed and cannot be modified during updates.",
                });
            }
        });
    }
    /**
     * Delete a stack and all its services
     * DELETE /api/stacks/:name
     */
    deleteStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name || req.params.id; // Support both :name and :id
                yield this.stackManager.deleteStack(stackName);
                res.status(204).send();
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        });
    }
    /**
     * List all deployed stacks
     * GET /api/stacks
     */
    listStacks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stacks = yield this.stackManager.listStacks();
                res.status(200).json({
                    stacks: stacks.map((stack) => ({
                        id: stack.id,
                        name: stack.name,
                        status: stack.status,
                        services: Object.keys(stack.services).length,
                        createdAt: stack.createdAt,
                        updatedAt: stack.updatedAt,
                    })),
                    resourcePolicy: "All stacks enforce 1 CPU and 2GB RAM per service container",
                    total: stacks.length,
                });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Get detailed information about a specific stack
     * GET /api/stacks/:name
     */
    getStack(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name || req.params.id; // Support both :name and :id
                const stack = yield this.stackManager.getStack(stackName);
                if (!stack) {
                    res.status(404).json({ message: "Stack not found" });
                    return;
                }
                res.status(200).json({
                    stack: Object.assign(Object.assign({}, stack), { resourceLimits: {
                            description: "All services have fixed resource limits",
                            cpuPerContainer: "1.0 CPU",
                            memoryPerContainer: "2GB",
                            cpuReservation: "0.25 CPU",
                            memoryReservation: "512MB",
                            scalingStrategy: "Horizontal scaling via replicas only",
                        } }),
                });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    /**
     * Scale a specific service within a stack
     * POST /api/stacks/:name/services/:serviceName/scale
     */
    scaleStackService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name;
                const serviceName = req.params.serviceName;
                const { replicas } = req.body;
                if (!replicas || replicas < 0) {
                    res.status(400).json({
                        message: "Valid replicas count is required",
                        note: "Resource limits per container are fixed. Scale horizontally by increasing replicas.",
                    });
                    return;
                }
                yield this.stackManager.scaleStackService(stackName, serviceName, replicas);
                res.status(200).json({
                    message: `Service '${serviceName}' in stack '${stackName}' scaled to ${replicas} replicas`,
                    scalingInfo: {
                        service: serviceName,
                        stack: stackName,
                        replicas: replicas,
                        resourcesPerReplica: "1 CPU, 2GB RAM (fixed)",
                        totalResources: `${replicas} CPU, ${replicas * 2}GB RAM`,
                    },
                });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    /**
     * Get all services within a stack
     * GET /api/stacks/:name/services
     */
    getStackServices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name;
                const services = yield this.stackManager.getStackServices(stackName);
                res.status(200).json({
                    services,
                    resourcePolicy: "Each service container is limited to 1 CPU and 2GB RAM",
                    stack: stackName,
                    totalServices: services.length,
                });
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        });
    }
    /**
     * Get logs from a stack or specific service
     * GET /api/stacks/:name/logs?service=serviceName
     */
    getStackLogs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stackName = req.params.name;
                const serviceName = req.query.service;
                const logs = yield this.stackManager.getStackLogs(stackName, serviceName);
                res.status(200).json(Object.assign({ logs, stack: stackName }, (serviceName && { service: serviceName })));
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        });
    }
}
exports.StackController = StackController;
