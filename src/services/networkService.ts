import Docker from "dockerode";

export class NetworkService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  public async createNetworkIfNotExists(
    networkName: string,
    options?: any
  ): Promise<any> {
    try {
      // Check if network already exists
      const networks = await this.docker.listNetworks({
        filters: { name: [networkName] },
      });

      if (networks.length > 0) {
        return networks[0];
      }

      // Create network if it doesn't exist
      const networkSpec = {
        Name: networkName,
        Driver: options?.driver || "overlay",
        Attachable: options?.attachable || true,
        Ingress: options?.ingress || false,
        IPAM: options?.ipam || {},
        EnableIPv6: options?.enableIPv6 || false,
        Options: options?.options || {},
        Labels: options?.labels || {},
      };

      const network = await this.docker.createNetwork(networkSpec);
      return await network.inspect();
    } catch (error: any) {
      throw new Error(`Failed to create network: ${error.message}`);
    }
  }

  public async listNetworks(): Promise<any[]> {
    try {
      return await this.docker.listNetworks();
    } catch (error: any) {
      throw new Error(`Failed to list networks: ${error.message}`);
    }
  }

  public async getNetwork(networkId: string): Promise<any> {
    try {
      const network = this.docker.getNetwork(networkId);
      return await network.inspect();
    } catch (error: any) {
      throw new Error(`Failed to get network: ${error.message}`);
    }
  }

  public async removeNetwork(networkId: string): Promise<void> {
    try {
      const network = this.docker.getNetwork(networkId);
      await network.remove();
    } catch (error: any) {
      throw new Error(`Failed to remove network: ${error.message}`);
    }
  }

  public async getNetworkByName(networkName: string): Promise<any | null> {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [networkName] },
      });
      return networks.length > 0 ? networks[0] : null;
    } catch (error: any) {
      throw new Error(`Failed to get network by name: ${error.message}`);
    }
  }
}
