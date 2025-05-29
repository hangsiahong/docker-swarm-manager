import { DockerService } from "./dockerService";

class ServiceManager {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  async createService(serviceConfig: any) {
    return await this.dockerService.createServiceAPI(serviceConfig);
  }

  async updateService(serviceId: string, serviceConfig: any) {
    return await this.dockerService.updateServiceAPI(serviceId, serviceConfig);
  }

  async deleteService(serviceId: string) {
    return await this.dockerService.deleteServiceAPI(serviceId);
  }

  async listServices() {
    return await this.dockerService.listServicesAPI();
  }
}

export default ServiceManager;
