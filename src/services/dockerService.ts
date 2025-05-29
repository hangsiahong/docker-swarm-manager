import Docker from "dockerode";
import { NetworkService } from "./networkService";

export class DockerService {
  private docker: Docker;
  private networkService: NetworkService;

  constructor() {
    this.docker = new Docker();
    this.networkService = new NetworkService();
  }

  /**
   * Returns standardized resource limits for all services
   * Fixed at 1 CPU and 2GB RAM per container
   * Users should scale by increasing replicas, not resources
   */
  private getStandardResourceLimits() {
    return {
      Limits: {
        NanoCPUs: 1000000000, // 1.0 CPU (1 billion nanocpus)
        MemoryBytes: 2147483648, // 2GB in bytes (2 * 1024 * 1024 * 1024)
      },
      Reservations: {
        NanoCPUs: 250000000, // 0.25 CPU minimum (250 million nanocpus)
        MemoryBytes: 536870912, // 512MB minimum (512 * 1024 * 1024)
      },
    };
  }

  public async createServiceAPI(serviceConfig: any): Promise<any> {
    try {
      const {
        name,
        image,
        replicas = 1,
        ports = [],
        env = [],
        labels = {},
        networks = [],
        networkIds = [], // New: Array of network IDs/names
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
          const network = await this.networkService.createNetworkIfNotExists(
            networkId,
            networkOptions[networkId] || {}
          );
          processedNetworks.push({
            Target: network.Id || network.ID,
            Aliases: networkOptions[networkId]?.aliases || [],
          });
        } catch (error: any) {
          throw new Error(
            `Failed to handle network ${networkId}: ${error.message}`
          );
        }
      }

      // Process existing networks array (backward compatibility)
      for (const network of networks) {
        if (typeof network === "string") {
          processedNetworks.push({ Target: network });
        } else {
          processedNetworks.push({
            Target: network.Target || network.id,
            ...(network.Aliases && { Aliases: network.Aliases }),
          });
        }
      }

      const serviceSpec: any = {
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
          // Add networks to TaskTemplate to be consistent with updates
          ...(processedNetworks.length > 0 && { Networks: processedNetworks }),
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
          Ports: ports.map((port: any) => ({
            Protocol: port.protocol || "tcp",
            TargetPort: port.target,
            PublishedPort: port.published,
            PublishMode: port.publishMode || "ingress",
          })),
        };
      }

      const service = await this.docker.createService(serviceSpec);
      return service;
    } catch (error: any) {
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  public async updateServiceAPI(
    serviceId: string,
    updateConfig: any
  ): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      const serviceInfo = await service.inspect();
      const currentSpec = serviceInfo.Spec;

      const {
        image,
        replicas,
        env,
        labels,
        ports,
        networks,
        networkIds,
        networkOptions,
        ...otherConfig
      } = updateConfig;

      // Handle network processing if networks are being updated
      let processedNetworks = [];
      if (networks || networkIds) {
        // Process networkIds (create if not exists)
        for (const networkId of networkIds || []) {
          try {
            const network = await this.networkService.createNetworkIfNotExists(
              networkId,
              networkOptions?.[networkId] || {}
            );
            processedNetworks.push({
              Target: network.Id || network.ID,
              Aliases: networkOptions?.[networkId]?.aliases || [],
            });
          } catch (error: any) {
            throw new Error(
              `Failed to handle network ${networkId}: ${error.message}`
            );
          }
        }

        // Process existing networks array (backward compatibility)
        for (const network of networks || []) {
          if (typeof network === "string") {
            processedNetworks.push({ Target: network });
          } else {
            processedNetworks.push({
              Target: network.Target || network.id,
              ...(network.Aliases && { Aliases: network.Aliases }),
            });
          }
        }
      } else {
        // Keep existing networks if no network changes specified
        // Handle both TaskTemplate.Networks and legacy service-level Networks
        processedNetworks =
          currentSpec.TaskTemplate.Networks || currentSpec.Networks || [];
      }

      // Build the update specification based on current service spec
      const updateSpec: any = {
        Name: currentSpec.Name,
        Labels: labels || currentSpec.Labels,
        TaskTemplate: {
          ...currentSpec.TaskTemplate,
          ContainerSpec: {
            ...currentSpec.TaskTemplate.ContainerSpec,
            ...(image && { Image: image }),
            ...(env && { Env: env }),
            ...(labels && {
              Labels: {
                ...currentSpec.TaskTemplate.ContainerSpec.Labels,
                ...labels,
              },
            }),
          },
          // Enforce fixed resource limits on updates
          Resources: this.getStandardResourceLimits(),
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
          // Always include networks in TaskTemplate to prevent migration issues
          Networks: processedNetworks,
        },
        Mode: currentSpec.Mode,
        EndpointSpec: currentSpec.EndpointSpec,
        ...otherConfig,
      };

      // Explicitly remove service-level Networks to force TaskTemplate-only networks
      if (updateSpec.Networks) {
        delete updateSpec.Networks;
      }

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
        updateSpec.EndpointSpec = {
          ...currentSpec.EndpointSpec,
          Ports: ports.map((port: any) => ({
            Protocol: port.protocol || "tcp",
            TargetPort: port.target,
            PublishedPort: port.published,
            PublishMode: port.publishMode || "ingress",
          })),
        };
      }

      const result = await service.update({
        version: serviceInfo.Version.Index,
        ...updateSpec,
      });

      return result;
    } catch (error: any) {
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  public async listServicesAPI(): Promise<any[]> {
    try {
      const services = await this.docker.listServices();
      return services;
    } catch (error: any) {
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }

  public async deleteServiceAPI(serviceId: string): Promise<void> {
    try {
      const service = await this.docker.getService(serviceId);
      await service.remove();
    } catch (error: any) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  }

  public async getServiceAPI(serviceId: string): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      return await service.inspect();
    } catch (error: any) {
      throw new Error(`Failed to get service: ${error.message}`);
    }
  }

  public async scaleServiceAPI(
    serviceId: string,
    replicas: number
  ): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      const serviceInfo = await service.inspect();

      const updateSpec = {
        version: serviceInfo.Version.Index,
        Mode: {
          Replicated: {
            Replicas: replicas,
          },
        },
      };

      return await service.update(updateSpec);
    } catch (error: any) {
      throw new Error(`Failed to scale service: ${error.message}`);
    }
  }

  public async getServiceLogsAPI(
    serviceId: string,
    options?: {
      taskId?: string;
      replicaIndex?: number;
      tail?: number;
      since?: string;
      follow?: boolean;
      timestamps?: boolean;
    }
  ): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);

      // If specific task/replica is requested, get logs from that task only
      if (options?.taskId || options?.replicaIndex !== undefined) {
        return await this.getTaskSpecificLogs(serviceId, options);
      }

      // For high replica counts, limit output by default
      const logOptions: any = {
        stdout: true,
        stderr: true,
        timestamps: options?.timestamps !== false,
        ...(options?.tail && { tail: Math.min(options.tail, 1000) }), // Max 1000 lines for safety
        ...(options?.since && { since: options.since }),
        ...(options?.follow && { follow: options.follow }),
      };

      // For services with many replicas, warn about potential performance impact
      const tasks = await this.getServiceTasksAPI(serviceId);
      if (tasks.length > 10 && !options?.tail) {
        console.warn(
          `Service ${serviceId} has ${tasks.length} replicas. Consider using 'tail' parameter for better performance.`
        );
      }

      const logsBuffer = await service.logs(logOptions);
      
      // Convert Buffer to string if it's a Buffer
      let logsString: string;
      if (Buffer.isBuffer(logsBuffer)) {
        logsString = logsBuffer.toString('utf8');
      } else if (typeof logsBuffer === 'string') {
        logsString = logsBuffer;
      } else {
        // If it's a stream or other format, try to convert to string
        logsString = String(logsBuffer);
      }
      
      return logsString;
    } catch (error: any) {
      throw new Error(`Failed to get service logs: ${error.message}`);
    }
  }

  /**
   * Get logs from a specific task/replica
   */
  private async getTaskSpecificLogs(
    serviceId: string,
    options: {
      taskId?: string;
      replicaIndex?: number;
      tail?: number;
      since?: string;
      follow?: boolean;
      timestamps?: boolean;
    }
  ): Promise<any> {
    try {
      const tasks = await this.getServiceTasksAPI(serviceId);

      let targetTask;
      if (options.taskId) {
        targetTask = tasks.find((task) => task.ID === options.taskId);
        if (!targetTask) {
          throw new Error(
            `Task ${options.taskId} not found in service ${serviceId}`
          );
        }
      } else if (options.replicaIndex !== undefined) {
        // Sort tasks by creation time to get consistent replica indexing
        const sortedTasks = tasks
          .filter((task) => task.Status?.State === "running")
          .sort(
            (a, b) =>
              new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
          );

        if (options.replicaIndex >= sortedTasks.length) {
          throw new Error(
            `Replica index ${options.replicaIndex} not found. Service has ${sortedTasks.length} running replicas.`
          );
        }
        targetTask = sortedTasks[options.replicaIndex];
      }

      if (!targetTask) {
        throw new Error("No valid task found for the specified criteria");
      }

      // Get logs from the specific container
      const container = this.docker.getContainer(
        targetTask.Status.ContainerStatus.ContainerID
      );
      const logOptions: any = {
        stdout: true,
        stderr: true,
        timestamps: options.timestamps !== false,
        ...(options.tail && { tail: Math.min(options.tail, 1000) }),
        ...(options.since && { since: options.since }),
        ...(options.follow && { follow: options.follow }),
      };

      const logsBuffer = await container.logs(logOptions);
      
      // Convert Buffer to string if it's a Buffer
      let logsString: string;
      if (Buffer.isBuffer(logsBuffer)) {
        logsString = logsBuffer.toString('utf8');
      } else if (typeof logsBuffer === 'string') {
        logsString = logsBuffer;
      } else {
        // If it's a stream or other format, try to convert to string
        logsString = String(logsBuffer);
      }
      
      return logsString;
    } catch (error: any) {
      throw new Error(`Failed to get task-specific logs: ${error.message}`);
    }
  }

  public async updateServiceEnvironmentAPI(
    serviceId: string,
    envVars: string[]
  ): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      const serviceInfo = await service.inspect();

      const currentSpec = serviceInfo.Spec;
      const updateSpec = {
        Name: currentSpec.Name,
        Labels: currentSpec.Labels,
        TaskTemplate: {
          ...currentSpec.TaskTemplate,
          ContainerSpec: {
            ...currentSpec.TaskTemplate.ContainerSpec,
            Env: envVars,
          },
          // Enforce fixed resource limits
          Resources: this.getStandardResourceLimits(),
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
          // Preserve existing networks to prevent migration issues
          Networks: currentSpec.TaskTemplate.Networks || [],
        },
        Mode: currentSpec.Mode,
        EndpointSpec: currentSpec.EndpointSpec,
      };

      const result = await service.update({
        version: serviceInfo.Version.Index,
        ...updateSpec,
      });

      return result;
    } catch (error: any) {
      throw new Error(`Failed to update service environment: ${error.message}`);
    }
  }

  public async rollingUpdateServiceAPI(
    serviceId: string,
    image: string,
    updateConfig?: {
      parallelism?: number;
      delay?: string;
      failureAction?: "pause" | "continue" | "rollback";
      monitor?: string;
      maxFailureRatio?: number;
      order?: "stop-first" | "start-first";
    }
  ): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      const serviceInfo = await service.inspect();

      const currentSpec = serviceInfo.Spec;
      const updateSpec = {
        Name: currentSpec.Name,
        Labels: currentSpec.Labels,
        TaskTemplate: {
          ...currentSpec.TaskTemplate,
          ContainerSpec: {
            ...currentSpec.TaskTemplate.ContainerSpec,
            Image: image,
          },
          // Enforce fixed resource limits
          Resources: this.getStandardResourceLimits(),
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
          // Preserve existing networks to prevent migration issues
          Networks: currentSpec.TaskTemplate.Networks || [],
        },
        Mode: currentSpec.Mode,
        EndpointSpec: currentSpec.EndpointSpec,
        UpdateConfig: {
          Parallelism: updateConfig?.parallelism || 1,
          Delay: this.parseDurationToNanoseconds(updateConfig?.delay || "10s"),
          FailureAction: updateConfig?.failureAction || "rollback",
          Monitor: this.parseDurationToNanoseconds(updateConfig?.monitor || "5s"),
          MaxFailureRatio: updateConfig?.maxFailureRatio || 0,
          Order: updateConfig?.order || "start-first",
        },
      };

      const result = await service.update({
        version: serviceInfo.Version.Index,
        ...updateSpec,
      });

      return result;
    } catch (error: any) {
      throw new Error(`Failed to perform rolling update: ${error.message}`);
    }
  }

  public async getServiceTasksAPI(serviceId: string): Promise<any[]> {
    try {
      const tasks = await this.docker.listTasks({
        filters: { service: [serviceId] },
      });
      return tasks;
    } catch (error: any) {
      throw new Error(`Failed to get service tasks: ${error.message}`);
    }
  }

  /**
   * Get detailed replica information for a service
   */
  public async getServiceReplicasAPI(serviceId: string): Promise<any> {
    try {
      const service = await this.getServiceAPI(serviceId);
      const tasks = await this.getServiceTasksAPI(serviceId);

      const replicas = tasks.map((task: any, index: number) => ({
        index,
        taskId: task.ID,
        nodeId: task.NodeID,
        status: task.Status?.State,
        containerId: task.Status?.ContainerStatus?.ContainerID,
        createdAt: task.CreatedAt,
        updatedAt: task.UpdatedAt,
        desired: task.DesiredState,
        message: task.Status?.Message,
        error: task.Status?.Err,
      }));

      return {
        serviceId,
        serviceName: service.Spec?.Name,
        totalReplicas: service.Spec?.Mode?.Replicated?.Replicas || 0,
        runningReplicas: replicas.filter((r: any) => r.status === "running")
          .length,
        replicas: replicas.sort((a: any, b: any) => a.index - b.index),
      };
    } catch (error: any) {
      throw new Error(`Failed to get service replicas: ${error.message}`);
    }
  }

  /**
   * Get logs from multiple replicas with pagination
   */
  public async getBulkReplicaLogsAPI(
    serviceId: string,
    options?: {
      replicaIndexes?: number[];
      tail?: number;
      since?: string;
      timestamps?: boolean;
      maxConcurrent?: number;
    }
  ): Promise<any> {
    try {
      const replicaInfo = await this.getServiceReplicasAPI(serviceId);
      const runningReplicas = replicaInfo.replicas.filter(
        (r: any) => r.status === "running"
      );

      // Limit concurrent replica log requests to prevent overload
      const maxConcurrent = options?.maxConcurrent || 5;
      const targetIndexes =
        options?.replicaIndexes ||
        runningReplicas.slice(0, maxConcurrent).map((r: any) => r.index);

      const logPromises = targetIndexes.map(async (replicaIndex: number) => {
        try {
          const logs = await this.getServiceLogsAPI(serviceId, {
            replicaIndex,
            tail: options?.tail || 100,
            since: options?.since,
            timestamps: options?.timestamps,
          });

          return {
            replicaIndex,
            taskId: runningReplicas.find((r: any) => r.index === replicaIndex)
              ?.taskId,
            logs,
            status: "success",
          };
        } catch (error: any) {
          return {
            replicaIndex,
            logs: null,
            status: "error",
            error: error.message,
          };
        }
      });

      // Execute requests with controlled concurrency
      const results = [];
      for (let i = 0; i < logPromises.length; i += maxConcurrent) {
        const batch = logPromises.slice(i, i + maxConcurrent);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
      }

      return {
        serviceId,
        serviceName: replicaInfo.serviceName,
        totalReplicas: replicaInfo.totalReplicas,
        requestedReplicas: targetIndexes.length,
        results,
        metadata: {
          maxConcurrent,
          tailLines: options?.tail || 100,
          note:
            replicaInfo.runningReplicas > 10
              ? `Service has ${replicaInfo.runningReplicas} replicas. Bulk log requests are limited to ${maxConcurrent} concurrent replicas for performance.`
              : undefined,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to get bulk replica logs: ${error.message}`);
    }
  }

  /**
   * Convert duration string to nanoseconds for Docker API
   * Supports: s (seconds), m (minutes), h (hours)
   * Examples: "10s" -> 10000000000, "1m" -> 60000000000
   */
  private parseDurationToNanoseconds(duration: string): number {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) {
      // Default to 10 seconds if invalid format
      return 10000000000;
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's':
        return value * 1000000000; // seconds to nanoseconds
      case 'm':
        return value * 60 * 1000000000; // minutes to nanoseconds
      case 'h':
        return value * 60 * 60 * 1000000000; // hours to nanoseconds
      default:
        return 10000000000; // default 10 seconds
    }
  }
}
