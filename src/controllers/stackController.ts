import { Request, Response } from "express";
import StackManager from "../services/stackManager";

export class StackController {
  private stackManager: StackManager;

  constructor() {
    this.stackManager = new StackManager();
  }

  public async createStack(req: Request, res: Response): Promise<void> {
    try {
      const stackData = req.body;
      const stack = await this.stackManager.createStack(stackData);
      res.status(201).json(stack);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async updateStack(req: Request, res: Response): Promise<void> {
    try {
      const stackId = req.params.id;
      const stackData = req.body;
      const updatedStack = await this.stackManager.updateStack(
        stackId,
        stackData
      );
      res.status(200).json(updatedStack);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async deleteStack(req: Request, res: Response): Promise<void> {
    try {
      const stackId = req.params.id;
      await this.stackManager.deleteStack(stackId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async listStacks(req: Request, res: Response): Promise<void> {
    try {
      const stacks = await this.stackManager.listStacks();
      res.status(200).json(stacks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async getStack(req: Request, res: Response): Promise<void> {
    try {
      const stackId = req.params.id;
      const stack = await this.stackManager.getStack(stackId);
      if (!stack) {
        res.status(404).json({ message: "Stack not found" });
        return;
      }
      res.status(200).json(stack);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
