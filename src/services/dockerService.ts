import Docker from "dockerode";

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  public async createServiceAPI(serviceConfig: any): Promise<any> {
    try {
      const service = await this.docker.createService(serviceConfig);
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
      const service = await this.docker.getService(serviceId);
      await service.update(updateConfig);
      return service;
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
}
