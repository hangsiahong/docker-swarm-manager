import { Request, Response } from "express";
import StackManager from "../services/stackManager";

export class StackController {
  private stackManager: StackManager;

  constructor() {
    this.stackManager = new StackManager();
  }

  /**
   * Create and deploy a new stack with enforced resource limits
   * POST /api/stacks
   */
  public async createStack(req: Request, res: Response): Promise<void> {
    try {
      const stackData = req.body;
      const stack = await this.stackManager.createStack(stackData);
      res.status(201).json({
        message: `Stack '${stack.name}' deployed successfully with fixed resource limits (1 CPU, 2GB RAM per service)`,
        stack: {
          id: stack.id,
          name: stack.name,
          status: stack.status,
          services: Object.keys(stack.services).length,
          resourcePolicy:
            "Fixed: 1 CPU, 2GB RAM per container. Scale with replicas, not resources.",
          createdAt: stack.createdAt,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
        resourcePolicy:
          "All services are limited to 1 CPU and 2GB RAM. Scale by increasing replicas.",
      });
    }
  }

  /**
   * Update an existing stack while maintaining resource limits
   * PUT /api/stacks/:name
   */
  public async updateStack(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name || req.params.id; // Support both :name and :id
      const stackData = req.body;
      const updatedStack = await this.stackManager.updateStack(
        stackName,
        stackData
      );
      res.status(200).json({
        message: `Stack '${updatedStack.name}' updated successfully with maintained resource limits`,
        stack: {
          id: updatedStack.id,
          name: updatedStack.name,
          status: updatedStack.status,
          services: Object.keys(updatedStack.services).length,
          resourcePolicy:
            "Fixed: 1 CPU, 2GB RAM per container. Resource limits cannot be changed.",
          updatedAt: updatedStack.updatedAt,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message,
        resourcePolicy:
          "Resource limits are fixed and cannot be modified during updates.",
      });
    }
  }

  /**
   * Delete a stack and all its services
   * DELETE /api/stacks/:name
   */
  public async deleteStack(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name || req.params.id; // Support both :name and :id
      await this.stackManager.deleteStack(stackName);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * List all deployed stacks
   * GET /api/stacks
   */
  public async listStacks(req: Request, res: Response): Promise<void> {
    try {
      const stacks = await this.stackManager.listStacks();
      res.status(200).json({
        stacks: stacks.map((stack) => ({
          id: stack.id,
          name: stack.name,
          status: stack.status,
          services: Object.keys(stack.services).length,
          createdAt: stack.createdAt,
          updatedAt: stack.updatedAt,
        })),
        resourcePolicy:
          "All stacks enforce 1 CPU and 2GB RAM per service container",
        total: stacks.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get detailed information about a specific stack
   * GET /api/stacks/:name
   */
  public async getStack(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name || req.params.id; // Support both :name and :id
      const stack = await this.stackManager.getStack(stackName);
      if (!stack) {
        res.status(404).json({ message: "Stack not found" });
        return;
      }
      res.status(200).json({
        stack: {
          ...stack,
          resourceLimits: {
            description: "All services have fixed resource limits",
            cpuPerContainer: "1.0 CPU",
            memoryPerContainer: "2GB",
            cpuReservation: "0.25 CPU",
            memoryReservation: "512MB",
            scalingStrategy: "Horizontal scaling via replicas only",
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Scale a specific service within a stack
   * POST /api/stacks/:name/services/:serviceName/scale
   */
  public async scaleStackService(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name;
      const serviceName = req.params.serviceName;
      const { replicas } = req.body;

      if (!replicas || replicas < 0) {
        res.status(400).json({
          message: "Valid replicas count is required",
          note: "Resource limits per container are fixed. Scale horizontally by increasing replicas.",
        });
        return;
      }

      await this.stackManager.scaleStackService(
        stackName,
        serviceName,
        replicas
      );
      res.status(200).json({
        message: `Service '${serviceName}' in stack '${stackName}' scaled to ${replicas} replicas`,
        scalingInfo: {
          service: serviceName,
          stack: stackName,
          replicas: replicas,
          resourcesPerReplica: "1 CPU, 2GB RAM (fixed)",
          totalResources: `${replicas} CPU, ${replicas * 2}GB RAM`,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Get all services within a stack
   * GET /api/stacks/:name/services
   */
  public async getStackServices(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name;
      const services = await this.stackManager.getStackServices(stackName);
      res.status(200).json({
        services,
        resourcePolicy:
          "Each service container is limited to 1 CPU and 2GB RAM",
        stack: stackName,
        totalServices: services.length,
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * Get logs from a stack or specific service
   * GET /api/stacks/:name/logs?service=serviceName&tail=100&replicaIndex=0
   */
  public async getStackLogs(req: Request, res: Response): Promise<void> {
    try {
      const stackName = req.params.name;
      const {
        service: serviceName,
        tail,
        since,
        timestamps,
        replicaIndex,
        taskId,
      } = req.query;

      // Parse query parameters
      const options: any = {};
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
      if (timestamps !== undefined) options.timestamps = timestamps === "true";
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
      if (taskId) options.taskId = taskId as string;

      const logs = await this.stackManager.getStackLogs(
        stackName,
        serviceName as string,
        options
      );

      res.status(200).json({
        logs,
        stack: stackName,
        ...(serviceName && { service: serviceName }),
        ...(Object.keys(options).length > 0 && { options }),
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * Get replica information for a specific service in a stack
   * GET /api/stacks/:name/services/:serviceName/replicas
   */
  public async getStackServiceReplicas(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { name: stackName, serviceName } = req.params;

      const replicas = await this.stackManager.getStackServiceReplicas(
        stackName,
        serviceName
      );
      res.status(200).json(replicas);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * Get bulk replica logs for a specific service in a stack
   * POST /api/stacks/:name/services/:serviceName/bulk-logs
   */
  public async getStackServiceBulkLogs(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { name: stackName, serviceName } = req.params;

      const { replicaIndexes, tail, since, timestamps, maxConcurrent } =
        req.body;

      // Validate replica indexes if provided
      if (replicaIndexes && !Array.isArray(replicaIndexes)) {
        res.status(400).json({
          error: "replicaIndexes must be an array of numbers",
        });
        return;
      }

      const options: any = {};
      if (replicaIndexes) options.replicaIndexes = replicaIndexes;
      if (tail) options.tail = Math.min(parseInt(tail), 1000);
      if (since) options.since = since;
      if (timestamps !== undefined) options.timestamps = timestamps;
      if (maxConcurrent)
        options.maxConcurrent = Math.min(parseInt(maxConcurrent), 10);

      const logs = await this.stackManager.getStackServiceBulkLogs(
        stackName,
        serviceName,
        options
      );
      res.status(200).json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
