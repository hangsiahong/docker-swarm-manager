import api from "./api";
import { ENDPOINTS } from "../config/api";
import {
  Service,
  ServiceTask,
  CreateServiceRequest,
  UpdateServiceRequest,
  ScaleServiceRequest,
  RollingUpdateRequest,
  ServiceReplica,
  BulkLogsRequest,
  BulkLogsResponse,
} from "../types";

export const serviceApi = {
  // List all services
  list: async (): Promise<Service[]> => {
    const response = await api.get(ENDPOINTS.SERVICES);
    return response.data;
  },

  // Get service by ID
  get: async (id: string): Promise<Service> => {
    const response = await api.get(ENDPOINTS.SERVICE(id));
    return response.data;
  },

  // Create new service
  create: async (
    serviceData: CreateServiceRequest
  ): Promise<{ ID: string; message: string }> => {
    const response = await api.post(ENDPOINTS.SERVICES, serviceData);
    return response.data;
  },

  // Update service
  update: async (
    id: string,
    updates: UpdateServiceRequest
  ): Promise<{ message: string; service: Service }> => {
    const response = await api.put(ENDPOINTS.SERVICE(id), updates);
    return response.data;
  },

  // Delete service
  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.SERVICE(id));
  },

  // Scale service
  scale: async (
    id: string,
    replicas: number
  ): Promise<{ message: string; service: Service }> => {
    const response = await api.post(ENDPOINTS.SERVICE_SCALE(id), { replicas });
    return response.data;
  },

  // Rolling update
  rollingUpdate: async (
    id: string,
    updateData: RollingUpdateRequest
  ): Promise<{ message: string }> => {
    const response = await api.post(
      ENDPOINTS.SERVICE_ROLLING_UPDATE(id),
      updateData
    );
    return response.data;
  },

  // Update environment variables
  updateEnvironment: async (
    id: string,
    env: string[]
  ): Promise<{ message: string }> => {
    const response = await api.put(ENDPOINTS.SERVICE_ENVIRONMENT(id), { env });
    return response.data;
  },

  // Get service tasks
  getTasks: async (id: string): Promise<ServiceTask[]> => {
    const response = await api.get(ENDPOINTS.SERVICE_TASKS(id));
    return response.data;
  },

  // Get service logs
  getLogs: async (
    id: string,
    options?: {
      taskId?: string;
      replicaIndex?: number;
      tail?: number;
      since?: string;
      follow?: boolean;
      timestamps?: boolean;
    }
  ): Promise<{ logs: string; metadata: any }> => {
    const params = new URLSearchParams();
    if (options?.taskId) params.append("taskId", options.taskId);
    if (options?.replicaIndex !== undefined)
      params.append("replicaIndex", options.replicaIndex.toString());
    if (options?.tail) params.append("tail", options.tail.toString());
    if (options?.since) params.append("since", options.since);
    if (options?.follow) params.append("follow", options.follow.toString());
    if (options?.timestamps)
      params.append("timestamps", options.timestamps.toString());

    const response = await api.get(`${ENDPOINTS.SERVICE_LOGS(id)}?${params}`);
    return response.data;
  },

  // Get service replicas
  getReplicas: async (
    id: string
  ): Promise<{
    totalReplicas: number;
    runningReplicas: number;
    replicas: ServiceReplica[];
  }> => {
    const response = await api.get(ENDPOINTS.SERVICE_REPLICAS(id));
    return response.data;
  },

  // Get bulk logs from multiple replicas
  getBulkLogs: async (
    id: string,
    data: BulkLogsRequest
  ): Promise<BulkLogsResponse> => {
    const response = await api.post(ENDPOINTS.SERVICE_BULK_LOGS(id), data);
    return response.data;
  },
};
