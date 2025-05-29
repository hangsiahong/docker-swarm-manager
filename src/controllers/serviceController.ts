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

  public async getService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await this.dockerService.getServiceAPI(id);
      res.status(200).json(service);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async scaleService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { replicas } = req.body;

      if (typeof replicas !== "number") {
        res.status(400).json({ error: "Replicas must be a number" });
        return;
      }

      const service = await this.dockerService.scaleServiceAPI(id, replicas);
      res.status(200).json({ message: "Service scaled successfully", service });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async getServiceLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const logs = await this.dockerService.getServiceLogsAPI(id);
      res.status(200).json({ logs });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
