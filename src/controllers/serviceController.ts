import { Request, Response } from "express";
import { DockerService } from "../services/dockerService";

export class ServiceController {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  public async createService(req: Request, res: Response): Promise<void> {
    try {
      const serviceData = req.body;
      const service = await this.dockerService.createServiceAPI(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const serviceData = req.body;
      const updatedService = await this.dockerService.updateServiceAPI(
        id,
        serviceData
      );
      res.status(200).json(updatedService);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.dockerService.deleteServiceAPI(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async listServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await this.dockerService.listServicesAPI();
      res.status(200).json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
