import { DockerService } from "./dockerService";
import { Stack } from "../models/stack";

export default class StackManager {
  private dockerService: DockerService;

  constructor() {
    this.dockerService = new DockerService();
  }

  public async createStack(stack: Stack): Promise<void> {
    await this.dockerService.createServiceAPI(stack);
  }

  public async updateStack(serviceId: any, stackData: any): Promise<void> {
    await this.dockerService.updateServiceAPI(serviceId, stackData);
  }

  public async deleteStack(stackId: string): Promise<void> {
    await this.dockerService.deleteServiceAPI(stackId);
  }

  public async listStacks(): Promise<Stack[]> {
    return await this.dockerService.listServicesAPI();
  }

  public async getStack(stackId: string): Promise<Stack | null> {
    const stacks = await this.dockerService.listServicesAPI();
    return stacks.find((stack) => stack.Id === stackId) || null;
  }
}
