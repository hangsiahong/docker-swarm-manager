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

      const version = serviceInfo.Version.Index;
      const result = await service.update({ version, ...updateConfig });
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
}
