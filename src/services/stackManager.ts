import { DockerService } from "./dockerService";
import { Stack, StackModel, StackService } from "../models/stack";
import { NetworkService } from "./networkService";

export default class StackManager {
  private dockerService: DockerService;
  private networkService: NetworkService;
  private deployedStacks: Map<string, Stack> = new Map(); // In-memory storage for stack metadata

  constructor() {
    this.dockerService = new DockerService();
    this.networkService = new NetworkService();
  }

  /**
   * Create and deploy a new stack with multiple services
   * All services get fixed resource limits (1 CPU, 2GB RAM)
   */
  public async createStack(stackConfig: any): Promise<Stack> {
    const { name, services, networks, volumes, env } = stackConfig;

    if (!name || !services) {
      throw new Error("Stack name and services are required");
    }

    // Check if stack already exists
    if (this.deployedStacks.has(name)) {
      throw new Error(
        `Stack '${name}' already exists. Use updateStack to modify it.`
      );
    }

    // Create stack model with enforced resource limits
    const stack = new StackModel(name, services, networks, volumes, env);

    try {
      // Create networks first
      if (networks) {
        await this.createStackNetworks(networks);
      }

      // Create volumes
      if (volumes) {
        await this.createStackVolumes(volumes);
      }

      // Deploy each service with fixed resource limits
      const deployedServices: string[] = [];

      for (const [serviceName, service] of Object.entries(stack.services)) {
        const fullServiceName = `${name}_${serviceName}`;

        try {
          const serviceConfig = {
            name: fullServiceName,
            image: service.image,
            replicas: service.deploy?.replicas || service.replicas || 1,
            ports: service.ports || [],
            env: this.buildEnvironmentArray(service.environment, env),
            labels: {
              ...service.labels,
              "com.docker.stack.namespace": name,
              "com.docker.stack.service": serviceName,
            },
            networks: service.networks || [],
            volumes: service.volumes || [],
            // Resource limits are enforced by DockerService.createServiceAPI
          };

          await this.dockerService.createServiceAPI(serviceConfig);
          deployedServices.push(fullServiceName);
        } catch (error: any) {
          // Rollback previously deployed services if one fails
          await this.rollbackServices(deployedServices);
          throw new Error(
            `Failed to deploy service '${serviceName}': ${error.message}`
          );
        }
      }

      stack.updateStatus("running");
      this.deployedStacks.set(name, stack);

      return stack;
    } catch (error: any) {
      stack.updateStatus("error");
      throw new Error(`Failed to deploy stack '${name}': ${error.message}`);
    }
  }

  /**
   * Update an existing stack
   * Resource limits remain fixed during updates
   */
  public async updateStack(
    stackName: string,
    updateConfig: any
  ): Promise<Stack> {
    const existingStack = this.deployedStacks.get(stackName);
    if (!existingStack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    existingStack.updateStatus("updating");

    try {
      const { services, networks, volumes, env } = updateConfig;

      // Update networks if provided
      if (networks) {
        await this.updateStackNetworks(networks);
      }

      // Update volumes if provided
      if (volumes) {
        await this.updateStackVolumes(volumes);
      }

      // Update services with maintained resource limits
      if (services) {
        for (const [serviceName, serviceUpdate] of Object.entries(services)) {
          const fullServiceName = `${stackName}_${serviceName}`;

          const updateData = {
            image: (serviceUpdate as StackService).image,
            replicas:
              (serviceUpdate as StackService).deploy?.replicas ||
              (serviceUpdate as StackService).replicas,
            env: this.buildEnvironmentArray(
              (serviceUpdate as StackService).environment,
              env
            ),
            ports: (serviceUpdate as StackService).ports,
            networks: (serviceUpdate as StackService).networks,
            // Resource limits are enforced by DockerService.updateServiceAPI
          };

          await this.dockerService.updateServiceAPI(
            fullServiceName,
            updateData
          );
        }

        // Update the stack model with enforced resource limits
        existingStack.updateServices(services);
      }

      existingStack.updateStatus("running");
      this.deployedStacks.set(stackName, existingStack);

      return existingStack;
    } catch (error: any) {
      existingStack.updateStatus("error");
      throw new Error(
        `Failed to update stack '${stackName}': ${error.message}`
      );
    }
  }

  /**
   * Delete a stack and all its services
   */
  public async deleteStack(stackName: string): Promise<void> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    try {
      // Delete all services in the stack
      for (const serviceName of Object.keys(stack.services)) {
        const fullServiceName = `${stackName}_${serviceName}`;
        try {
          await this.dockerService.deleteServiceAPI(fullServiceName);
        } catch (error: any) {
          console.warn(
            `Failed to delete service '${fullServiceName}': ${error.message}`
          );
        }
      }

      // Remove stack from memory
      this.deployedStacks.delete(stackName);
    } catch (error: any) {
      throw new Error(
        `Failed to delete stack '${stackName}': ${error.message}`
      );
    }
  }

  /**
   * List all deployed stacks
   */
  public async listStacks(): Promise<Stack[]> {
    return Array.from(this.deployedStacks.values());
  }

  /**
   * Get a specific stack by name
   */
  public async getStack(stackName: string): Promise<Stack | null> {
    return this.deployedStacks.get(stackName) || null;
  }

  /**
   * Scale a specific service within a stack
   * Resource limits per container remain fixed - only replica count changes
   */
  public async scaleStackService(
    stackName: string,
    serviceName: string,
    replicas: number
  ): Promise<void> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    if (!stack.services[serviceName]) {
      throw new Error(
        `Service '${serviceName}' not found in stack '${stackName}'`
      );
    }

    const fullServiceName = `${stackName}_${serviceName}`;

    try {
      await this.dockerService.scaleServiceAPI(fullServiceName, replicas);

      // Update the stack model
      stack.services[serviceName].replicas = replicas;
      if (stack.services[serviceName].deploy) {
        stack.services[serviceName].deploy!.replicas = replicas;
      }
      stack.updatedAt = new Date();

      this.deployedStacks.set(stackName, stack);
    } catch (error: any) {
      throw new Error(
        `Failed to scale service '${serviceName}' in stack '${stackName}': ${error.message}`
      );
    }
  }

  /**
   * Get all services within a stack
   */
  public async getStackServices(stackName: string): Promise<any[]> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    const services = [];
    for (const serviceName of Object.keys(stack.services)) {
      const fullServiceName = `${stackName}_${serviceName}`;
      try {
        const service = await this.dockerService.getServiceAPI(fullServiceName);
        services.push(service);
      } catch (error: any) {
        console.warn(
          `Failed to get service '${fullServiceName}': ${error.message}`
        );
      }
    }

    return services;
  }

  /**
   * Get logs for all services in a stack or a specific service
   */
  public async getStackLogs(
    stackName: string,
    serviceName?: string,
    options?: {
      tail?: number;
      since?: string;
      timestamps?: boolean;
      replicaIndex?: number;
      taskId?: string;
    }
  ): Promise<any> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    if (serviceName) {
      if (!stack.services[serviceName]) {
        throw new Error(
          `Service '${serviceName}' not found in stack '${stackName}'`
        );
      }
      const fullServiceName = `${stackName}_${serviceName}`;

      // Enhanced logging with options support
      const logs = await this.dockerService.getServiceLogsAPI(
        fullServiceName,
        options
      );

      // Get replica info for context
      const replicas = await this.dockerService.getServiceReplicasAPI(
        fullServiceName
      );

      return {
        stackName,
        serviceName,
        logs,
        metadata: {
          totalReplicas: replicas.totalReplicas,
          runningReplicas: replicas.runningReplicas,
          options,
          note:
            replicas.runningReplicas > 10 && !options?.tail
              ? "High replica count detected. Consider using 'tail' parameter for better performance."
              : undefined,
        },
      };
    }

    // Get logs from all services with performance considerations
    const logs: Record<string, any> = {};
    const serviceNames = Object.keys(stack.services);

    // Limit concurrent service log requests
    const maxConcurrentServices = 3;
    for (let i = 0; i < serviceNames.length; i += maxConcurrentServices) {
      const batch = serviceNames.slice(i, i + maxConcurrentServices);
      const batchPromises = batch.map(async (svcName) => {
        const fullServiceName = `${stackName}_${svcName}`;
        try {
          // For stack-wide logs, limit output for performance
          const serviceOptions = {
            ...options,
            tail: options?.tail || 50, // Default to 50 lines for stack-wide logs
          };

          const serviceLogs = await this.dockerService.getServiceLogsAPI(
            fullServiceName,
            serviceOptions
          );

          // Get replica count for context
          const replicas = await this.dockerService.getServiceReplicasAPI(
            fullServiceName
          );

          return {
            serviceName: svcName,
            logs: serviceLogs,
            replicas: {
              total: replicas.totalReplicas,
              running: replicas.runningReplicas,
            },
          };
        } catch (error: any) {
          return {
            serviceName: svcName,
            logs: null,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        logs[result.serviceName] = result;
      });
    }

    return {
      stackName,
      services: logs,
      metadata: {
        totalServices: serviceNames.length,
        options,
        note: "Stack-wide logs are limited to improve performance. Use service-specific logs for full output.",
      },
    };
  }

  /**
   * Create networks for the stack
   */
  private async createStackNetworks(
    networks: Record<string, any>
  ): Promise<void> {
    for (const [networkName, networkConfig] of Object.entries(networks)) {
      try {
        await this.networkService.createNetworkIfNotExists(networkName, {
          driver: networkConfig.driver || "overlay",
          attachable: networkConfig.attachable || true,
          ...networkConfig,
        });
      } catch (error: any) {
        console.warn(
          `Failed to create network '${networkName}': ${error.message}`
        );
      }
    }
  }

  /**
   * Update networks for the stack
   */
  private async updateStackNetworks(
    networks: Record<string, any>
  ): Promise<void> {
    // For now, we just ensure networks exist
    await this.createStackNetworks(networks);
  }

  /**
   * Create volumes for the stack
   */
  private async createStackVolumes(
    volumes: Record<string, any>
  ): Promise<void> {
    // Volume creation would be implemented here
    // For now, just log the volumes that would be created
    for (const [volumeName, volumeConfig] of Object.entries(volumes)) {
      console.log(
        `Volume '${volumeName}' would be created with config:`,
        volumeConfig
      );
    }
  }

  /**
   * Update volumes for the stack
   */
  private async updateStackVolumes(
    volumes: Record<string, any>
  ): Promise<void> {
    // Volume updates would be implemented here
    await this.createStackVolumes(volumes);
  }

  /**
   * Build environment array from service env and stack env
   */
  private buildEnvironmentArray(
    serviceEnv?: string[],
    stackEnv?: Record<string, string>
  ): string[] {
    const env: string[] = [];

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
  private async rollbackServices(serviceNames: string[]): Promise<void> {
    for (const serviceName of serviceNames) {
      try {
        await this.dockerService.deleteServiceAPI(serviceName);
      } catch (error: any) {
        console.warn(
          `Failed to rollback service '${serviceName}': ${error.message}`
        );
      }
    }
  }

  /**
   * Get replica information for a service in a stack
   */
  public async getStackServiceReplicas(
    stackName: string,
    serviceName: string
  ): Promise<any> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    if (!stack.services[serviceName]) {
      throw new Error(
        `Service '${serviceName}' not found in stack '${stackName}'`
      );
    }

    const fullServiceName = `${stackName}_${serviceName}`;
    const replicas = await this.dockerService.getServiceReplicasAPI(
      fullServiceName
    );

    return {
      ...replicas,
      stackName,
      serviceName,
    };
  }

  /**
   * Get bulk replica logs for a service in a stack
   */
  public async getStackServiceBulkLogs(
    stackName: string,
    serviceName: string,
    options?: {
      replicaIndexes?: number[];
      tail?: number;
      since?: string;
      timestamps?: boolean;
      maxConcurrent?: number;
    }
  ): Promise<any> {
    const stack = this.deployedStacks.get(stackName);
    if (!stack) {
      throw new Error(`Stack '${stackName}' not found`);
    }

    if (!stack.services[serviceName]) {
      throw new Error(
        `Service '${serviceName}' not found in stack '${stackName}'`
      );
    }

    const fullServiceName = `${stackName}_${serviceName}`;
    const logs = await this.dockerService.getBulkReplicaLogsAPI(
      fullServiceName,
      options
    );

    return {
      ...logs,
      stackName,
      serviceName,
    };
  }
}
