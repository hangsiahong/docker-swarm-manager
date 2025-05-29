import api from "./api";
import { ENDPOINTS } from "../config/api";
import {
  Stack,
  StackListItem,
  CreateStackRequest,
  Service,
  ServiceReplica,
  BulkLogsRequest,
  BulkLogsResponse,
} from "../types";

export const stackApi = {
  // List all stacks
  list: async (): Promise<{
    stacks: Array<StackListItem>;
    resourcePolicy: string;
    total: number;
  }> => {
    const response = await api.get(ENDPOINTS.STACKS);
    return response.data;
  },

  // Get stack by name
  get: async (name: string): Promise<{ stack: Stack; resourceLimits: any }> => {
    const response = await api.get(ENDPOINTS.STACK(name));
    return response.data;
  },

  // Create new stack
  create: async (
    stackData: CreateStackRequest
  ): Promise<{
    message: string;
    stack: {
      id: string;
      name: string;
      status: string;
      services: number;
      resourcePolicy: string;
      createdAt: string;
    };
  }> => {
    const response = await api.post(ENDPOINTS.STACKS, stackData);
    return response.data;
  },

  // Update stack
  update: async (
    name: string,
    updates: Partial<CreateStackRequest>
  ): Promise<{
    message: string;
    stack: Stack;
  }> => {
    const response = await api.put(ENDPOINTS.STACK(name), updates);
    return response.data;
  },

  // Delete stack
  delete: async (
    name: string,
    options?: { volumes?: boolean; networks?: boolean }
  ): Promise<void> => {
    const params = new URLSearchParams();
    if (options?.volumes) params.append("volumes", "true");
    if (options?.networks) params.append("networks", "true");

    await api.delete(`${ENDPOINTS.STACK(name)}?${params}`);
  },

  // Get stack services
  getServices: async (
    name: string
  ): Promise<{
    services: Service[];
    resourcePolicy: string;
    stack: string;
    totalServices: number;
  }> => {
    const response = await api.get(ENDPOINTS.STACK_SERVICES(name));
    return response.data;
  },

  // Scale stack service
  scaleService: async (
    stackName: string,
    serviceName: string,
    replicas: number
  ): Promise<{
    message: string;
    scalingInfo: {
      service: string;
      stack: string;
      replicas: number;
      resourcesPerReplica: string;
      totalResources: string;
    };
  }> => {
    const response = await api.post(
      ENDPOINTS.STACK_SERVICE_SCALE(stackName, serviceName),
      { replicas }
    );
    return response.data;
  },

  // Get stack service replicas
  getServiceReplicas: async (
    stackName: string,
    serviceName: string
  ): Promise<{
    stackName: string;
    serviceName: string;
    totalReplicas: number;
    runningReplicas: number;
    replicas: ServiceReplica[];
  }> => {
    const response = await api.get(
      ENDPOINTS.STACK_SERVICE_REPLICAS(stackName, serviceName)
    );
    return response.data;
  },

  // Get stack service bulk logs
  getServiceBulkLogs: async (
    stackName: string,
    serviceName: string,
    data: BulkLogsRequest
  ): Promise<BulkLogsResponse> => {
    const response = await api.post(
      ENDPOINTS.STACK_SERVICE_BULK_LOGS(stackName, serviceName),
      data
    );
    return response.data;
  },

  // Get stack logs
  getLogs: async (
    name: string,
    options?: {
      service?: string;
      tail?: number;
      replicaIndex?: number;
    }
  ): Promise<{
    logs: any;
    stack: string;
    options?: any;
  }> => {
    const params = new URLSearchParams();
    if (options?.service) params.append("service", options.service);
    if (options?.tail) params.append("tail", options.tail.toString());
    if (options?.replicaIndex !== undefined)
      params.append("replicaIndex", options.replicaIndex.toString());

    const response = await api.get(`${ENDPOINTS.STACK_LOGS(name)}?${params}`);
    return response.data;
  },
};
