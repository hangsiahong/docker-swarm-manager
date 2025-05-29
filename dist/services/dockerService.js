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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const networkService_1 = require("./networkService");
class DockerService {
    constructor() {
        this.docker = new dockerode_1.default();
        this.networkService = new networkService_1.NetworkService();
    }
    /**
     * Returns standardized resource limits for all services
     * Fixed at 1 CPU and 2GB RAM per container
     * Users should scale by increasing replicas, not resources
     */
    getStandardResourceLimits() {
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
    createServiceAPI(serviceConfig) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, image, replicas = 1, ports = [], env = [], labels = {}, networks = [], networkIds = [], // New: Array of network IDs/names
                networkOptions = {}, // New: Network creation options
                 } = serviceConfig;
                if (!name || !image) {
                    throw new Error("Name and image are required");
                }
                // Handle network creation/validation
                const processedNetworks = [];
                // Process networkIds (create if not exists)
                for (const networkId of networkIds) {
                    try {
                        const network = yield this.networkService.createNetworkIfNotExists(networkId, networkOptions[networkId] || {});
                        processedNetworks.push({
                            Target: network.Id || network.ID,
                            Aliases: ((_a = networkOptions[networkId]) === null || _a === void 0 ? void 0 : _a.aliases) || [],
                        });
                    }
                    catch (error) {
                        throw new Error(`Failed to handle network ${networkId}: ${error.message}`);
                    }
                }
                // Process existing networks array (backward compatibility)
                for (const network of networks) {
                    if (typeof network === "string") {
                        processedNetworks.push({ Target: network });
                    }
                    else {
                        processedNetworks.push(Object.assign({ Target: network.Target || network.id }, (network.Aliases && { Aliases: network.Aliases })));
                    }
                }
                const serviceSpec = {
                    Name: name,
                    TaskTemplate: {
                        ContainerSpec: {
                            Image: image,
                            Env: env,
                            Labels: labels,
                        },
                        Resources: this.getStandardResourceLimits(),
                        RestartPolicy: {
                            Condition: "on-failure",
                        },
                        Placement: {},
                    },
                    Mode: {
                        Replicated: {
                            Replicas: replicas,
                        },
                    },
                };
                // Only add EndpointSpec if ports are specified
                if (ports.length > 0) {
                    serviceSpec.EndpointSpec = {
                        Mode: "vip",
                        Ports: ports.map((port) => ({
                            Protocol: port.protocol || "tcp",
                            TargetPort: port.target,
                            PublishedPort: port.published,
                            PublishMode: port.publishMode || "ingress",
                        })),
                    };
                }
                // Only add Networks if specified
                if (processedNetworks.length > 0) {
                    serviceSpec.Networks = processedNetworks;
                }
                const service = yield this.docker.createService(serviceSpec);
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
                const service = this.docker.getService(serviceId);
                const serviceInfo = yield service.inspect();
                const { image, replicas, env, labels, ports, networks } = updateConfig, otherConfig = __rest(updateConfig, ["image", "replicas", "env", "labels", "ports", "networks"]);
                // Build the update specification based on current service spec
                const currentSpec = serviceInfo.Spec;
                const updateSpec = Object.assign({ Name: currentSpec.Name, Labels: labels || currentSpec.Labels, TaskTemplate: Object.assign(Object.assign({}, currentSpec.TaskTemplate), { ContainerSpec: Object.assign(Object.assign(Object.assign(Object.assign({}, currentSpec.TaskTemplate.ContainerSpec), (image && { Image: image })), (env && { Env: env })), (labels && {
                            Labels: Object.assign(Object.assign({}, currentSpec.TaskTemplate.ContainerSpec.Labels), labels),
                        })), 
                        // Enforce fixed resource limits on updates
                        Resources: this.getStandardResourceLimits(), ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1 }), Mode: currentSpec.Mode, EndpointSpec: currentSpec.EndpointSpec }, otherConfig);
                // Handle replicas update
                if (replicas !== undefined) {
                    if (currentSpec.Mode.Replicated) {
                        updateSpec.Mode = {
                            Replicated: {
                                Replicas: replicas,
                            },
                        };
                    }
                }
                // Handle ports update
                if (ports) {
                    updateSpec.EndpointSpec = Object.assign(Object.assign({}, currentSpec.EndpointSpec), { Ports: ports.map((port) => ({
                            Protocol: port.protocol || "tcp",
                            TargetPort: port.target,
                            PublishedPort: port.published,
                            PublishMode: port.publishMode || "ingress",
                        })) });
                }
                // Handle networks update
                if (networks) {
                    updateSpec.TaskTemplate.Networks = networks.map((network) => (Object.assign({ Target: typeof network === "string" ? network : network.Target }, (network.Aliases && { Aliases: network.Aliases }))));
                }
                const result = yield service.update(Object.assign({ version: serviceInfo.Version.Index }, updateSpec));
                return result;
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
    getServiceAPI(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.docker.getService(serviceId);
                return yield service.inspect();
            }
            catch (error) {
                throw new Error(`Failed to get service: ${error.message}`);
            }
        });
    }
    scaleServiceAPI(serviceId, replicas) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.docker.getService(serviceId);
                const serviceInfo = yield service.inspect();
                const updateSpec = {
                    version: serviceInfo.Version.Index,
                    Mode: {
                        Replicated: {
                            Replicas: replicas,
                        },
                    },
                };
                return yield service.update(updateSpec);
            }
            catch (error) {
                throw new Error(`Failed to scale service: ${error.message}`);
            }
        });
    }
    getServiceLogsAPI(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.docker.getService(serviceId);
                return yield service.logs({
                    stdout: true,
                    stderr: true,
                    timestamps: true,
                });
            }
            catch (error) {
                throw new Error(`Failed to get service logs: ${error.message}`);
            }
        });
    }
    updateServiceEnvironmentAPI(serviceId, envVars) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.docker.getService(serviceId);
                const serviceInfo = yield service.inspect();
                const currentSpec = serviceInfo.Spec;
                const updateSpec = {
                    Name: currentSpec.Name,
                    Labels: currentSpec.Labels,
                    TaskTemplate: Object.assign(Object.assign({}, currentSpec.TaskTemplate), { ContainerSpec: Object.assign(Object.assign({}, currentSpec.TaskTemplate.ContainerSpec), { Env: envVars }), 
                        // Enforce fixed resource limits
                        Resources: this.getStandardResourceLimits(), ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1 }),
                    Mode: currentSpec.Mode,
                    EndpointSpec: currentSpec.EndpointSpec,
                };
                const result = yield service.update(Object.assign({ version: serviceInfo.Version.Index }, updateSpec));
                return result;
            }
            catch (error) {
                throw new Error(`Failed to update service environment: ${error.message}`);
            }
        });
    }
    rollingUpdateServiceAPI(serviceId, image, updateConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.docker.getService(serviceId);
                const serviceInfo = yield service.inspect();
                const currentSpec = serviceInfo.Spec;
                const updateSpec = {
                    Name: currentSpec.Name,
                    Labels: currentSpec.Labels,
                    TaskTemplate: Object.assign(Object.assign({}, currentSpec.TaskTemplate), { ContainerSpec: Object.assign(Object.assign({}, currentSpec.TaskTemplate.ContainerSpec), { Image: image }), 
                        // Enforce fixed resource limits
                        Resources: this.getStandardResourceLimits(), ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1 }),
                    Mode: currentSpec.Mode,
                    EndpointSpec: currentSpec.EndpointSpec,
                    UpdateConfig: {
                        Parallelism: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.parallelism) || 1,
                        Delay: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.delay) || "10s",
                        FailureAction: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.failureAction) || "rollback",
                        Monitor: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.monitor) || "5s",
                        MaxFailureRatio: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.maxFailureRatio) || 0,
                        Order: (updateConfig === null || updateConfig === void 0 ? void 0 : updateConfig.order) || "start-first",
                    },
                };
                const result = yield service.update(Object.assign({ version: serviceInfo.Version.Index }, updateSpec));
                return result;
            }
            catch (error) {
                throw new Error(`Failed to perform rolling update: ${error.message}`);
            }
        });
    }
    getServiceTasksAPI(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tasks = yield this.docker.listTasks({
                    filters: { service: [serviceId] },
                });
                return tasks;
            }
            catch (error) {
                throw new Error(`Failed to get service tasks: ${error.message}`);
            }
        });
    }
}
exports.DockerService = DockerService;
