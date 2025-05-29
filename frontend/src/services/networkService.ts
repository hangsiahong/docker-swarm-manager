import api from "./api";
import { ENDPOINTS } from "../config/api";
import { Network, CreateNetworkRequest } from "../types";

export const networkApi = {
  // List all networks
  list: async (): Promise<Network[]> => {
    const response = await api.get(ENDPOINTS.NETWORKS);
    return response.data;
  },

  // Get network by ID
  get: async (id: string): Promise<Network> => {
    const response = await api.get(ENDPOINTS.NETWORK(id));
    return response.data;
  },

  // Create new network
  create: async (
    networkData: CreateNetworkRequest
  ): Promise<{
    message: string;
    network: Network;
  }> => {
    const response = await api.post(ENDPOINTS.NETWORKS, networkData);
    return response.data;
  },

  // Delete network
  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.NETWORK(id));
  },
};
