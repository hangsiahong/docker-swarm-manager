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
      const { taskId, replicaIndex, tail, since, follow, timestamps } =
        req.query;

      // Parse query parameters
      const options: any = {};

      if (taskId) options.taskId = taskId as string;
      if (replicaIndex !== undefined) {
        const index = parseInt(replicaIndex as string);
        if (isNaN(index) || index < 0) {
          res.status(400).json({
            error: "replicaIndex must be a non-negative number",
          });
          return;
        }
        options.replicaIndex = index;
      }
      if (tail) {
        const tailLines = parseInt(tail as string);
        if (isNaN(tailLines) || tailLines < 1) {
          res.status(400).json({
            error: "tail must be a positive number",
          });
          return;
        }
        options.tail = tailLines;
      }
      if (since) options.since = since as string;
      if (follow) options.follow = follow === "true";
      if (timestamps !== undefined) options.timestamps = timestamps === "true";

      // Get service info for context
      const service = await this.dockerService.getServiceAPI(id);
      const tasks = await this.dockerService.getServiceTasksAPI(id);
      const runningReplicas = tasks.filter(
        (task) => task.Status?.State === "running"
      ).length;

      const logs = await this.dockerService.getServiceLogsAPI(id, options);

      res.status(200).json({
        logs,
        metadata: {
          serviceId: id,
          serviceName: service.Spec?.Name,
          totalReplicas: service.Spec?.Mode?.Replicated?.Replicas || 0,
          runningReplicas,
          options: {
            ...options,
            note:
              runningReplicas > 10 && !options.tail
                ? "High replica count detected. Consider using 'tail' parameter for better performance."
                : undefined,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async updateServiceEnvironment(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { env } = req.body;

      if (!Array.isArray(env)) {
        res
          .status(400)
          .json({ error: "Environment variables must be an array" });
        return;
      }

      const service = await this.dockerService.updateServiceEnvironmentAPI(
        id,
        env
      );
      res
        .status(200)
        .json({ message: "Service environment updated successfully", service });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async rollingUpdateService(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { image, updateConfig } = req.body;

      if (!image) {
        res.status(400).json({ error: "Image is required for rolling update" });
        return;
      }

      const service = await this.dockerService.rollingUpdateServiceAPI(
        id,
        image,
        updateConfig
      );
      res
        .status(200)
        .json({ message: "Rolling update initiated successfully", service });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async getServiceTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tasks = await this.dockerService.getServiceTasksAPI(id);
      res.status(200).json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get replica information for a service
   * GET /api/services/:id/replicas
   */
  public async getServiceReplicas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const replicas = await this.dockerService.getServiceReplicasAPI(id);
      res.status(200).json(replicas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get logs from multiple replicas with performance optimizations
   * POST /api/services/:id/bulk-logs
   */
  public async getBulkReplicaLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { replicaIndexes, tail, since, timestamps, maxConcurrent } =
        req.body;

      // Validate replica indexes if provided
      if (replicaIndexes && !Array.isArray(replicaIndexes)) {
        res.status(400).json({
          error: "replicaIndexes must be an array of numbers",
        });
        return;
      }

      if (replicaIndexes) {
        for (const index of replicaIndexes) {
          if (typeof index !== "number" || index < 0) {
            res.status(400).json({
              error: "All replica indexes must be non-negative numbers",
            });
            return;
          }
        }
      }

      const options: any = {};
      if (replicaIndexes) options.replicaIndexes = replicaIndexes;
      if (tail) options.tail = Math.min(parseInt(tail), 1000); // Max 1000 lines
      if (since) options.since = since;
      if (timestamps !== undefined) options.timestamps = timestamps;
      if (maxConcurrent)
        options.maxConcurrent = Math.min(parseInt(maxConcurrent), 10); // Max 10 concurrent

      const logs = await this.dockerService.getBulkReplicaLogsAPI(id, options);
      res.status(200).json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
