import { Request, Response } from "express";
import { NetworkService } from "../services/networkService";
import logger from "../utils/logger";

export class NetworkController {
  private networkService: NetworkService;

  constructor() {
    this.networkService = new NetworkService();
  }

  public async createNetwork(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        driver = "overlay",
        attachable = true,
        options = {},
      } = req.body;

      if (!name) {
        res.status(400).json({ error: "Network name is required" });
        return;
      }

      const networkConfig = {
        driver,
        attachable,
        options,
        ...req.body,
      };

      const network = await this.networkService.createNetworkIfNotExists(
        name,
        networkConfig
      );
      logger.info(`Network ${name} created successfully`);
      res
        .status(201)
        .json({ message: "Network created successfully", network });
    } catch (error: any) {
      logger.error(`Failed to create network: ${error.message}`);
      res
        .status(500)
        .json({ message: `Failed to create network: ${error.message}` });
    }
  }

  public async listNetworks(req: Request, res: Response): Promise<void> {
    try {
      const networks = await this.networkService.listNetworks();
      res.json(networks);
    } catch (error: any) {
      logger.error(`Failed to list networks: ${error.message}`);
      res
        .status(500)
        .json({ message: `Failed to list networks: ${error.message}` });
    }
  }

  public async getNetwork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const network = await this.networkService.getNetwork(id);
      res.json(network);
    } catch (error: any) {
      logger.error(`Failed to get network: ${error.message}`);
      res
        .status(500)
        .json({ message: `Failed to get network: ${error.message}` });
    }
  }

  public async deleteNetwork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.networkService.removeNetwork(id);
      logger.info(`Network ${id} deleted successfully`);
      res.json({ message: "Network deleted successfully" });
    } catch (error: any) {
      logger.error(`Failed to delete network: ${error.message}`);
      res
        .status(500)
        .json({ message: `Failed to delete network: ${error.message}` });
    }
  }
}
