import Docker from "dockerode";

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
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
      } = serviceConfig;

      if (!name || !image) {
        throw new Error("Name and image are required");
      }

      const serviceSpec = {
        Name: name,
        TaskTemplate: {
          ContainerSpec: {
            Image: image,
            Env: env,
            Labels: labels,
          },
          Resources: {},
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
        EndpointSpec: {
          Mode: "vip",
          Ports: ports.map((port: any) => ({
            Protocol: "tcp",
            TargetPort: port.target,
            PublishedPort: port.published,
            PublishMode: "ingress",
          })),
        },
        Networks: networks.map((network: any) => ({
          Target: network,
        })),
      };

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

      const { image, replicas, env, labels, ports, networks, ...otherConfig } =
        updateConfig;

      // Build the update specification based on current service spec
      const currentSpec = serviceInfo.Spec;
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
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
        },
        Mode: currentSpec.Mode,
        EndpointSpec: currentSpec.EndpointSpec,
        ...otherConfig,
      };

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

      // Handle networks update
      if (networks) {
        updateSpec.TaskTemplate.Networks = networks.map((network: any) => ({
          Target: typeof network === "string" ? network : network.Target,
          ...(network.Aliases && { Aliases: network.Aliases }),
        }));
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

  public async getServiceLogsAPI(serviceId: string): Promise<any> {
    try {
      const service = this.docker.getService(serviceId);
      return await service.logs({
        stdout: true,
        stderr: true,
        timestamps: true,
      });
    } catch (error: any) {
      throw new Error(`Failed to get service logs: ${error.message}`);
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
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
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
          ForceUpdate: (currentSpec.TaskTemplate.ForceUpdate || 0) + 1,
        },
        Mode: currentSpec.Mode,
        EndpointSpec: currentSpec.EndpointSpec,
        UpdateConfig: {
          Parallelism: updateConfig?.parallelism || 1,
          Delay: updateConfig?.delay || "10s",
          FailureAction: updateConfig?.failureAction || "rollback",
          Monitor: updateConfig?.monitor || "5s",
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
}
