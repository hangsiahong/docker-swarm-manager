export const API_BASE_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3456/api" : "/api";

export const ENDPOINTS = {
  // Services
  SERVICES: "/services",
  SERVICE: (id: string) => `/services/${id}`,
  SERVICE_SCALE: (id: string) => `/services/${id}/scale`,
  SERVICE_LOGS: (id: string) => `/services/${id}/logs`,
  SERVICE_TASKS: (id: string) => `/services/${id}/tasks`,
  SERVICE_ENVIRONMENT: (id: string) => `/services/${id}/environment`,
  SERVICE_ROLLING_UPDATE: (id: string) => `/services/${id}/rolling-update`,
  SERVICE_REPLICAS: (id: string) => `/services/${id}/replicas`,
  SERVICE_BULK_LOGS: (id: string) => `/services/${id}/bulk-logs`,

  // Stacks
  STACKS: "/stacks",
  STACK: (name: string) => `/stacks/${name}`,
  STACK_SERVICES: (name: string) => `/stacks/${name}/services`,
  STACK_SERVICE_SCALE: (name: string, serviceName: string) =>
    `/stacks/${name}/services/${serviceName}/scale`,
  STACK_SERVICE_REPLICAS: (name: string, serviceName: string) =>
    `/stacks/${name}/services/${serviceName}/replicas`,
  STACK_SERVICE_BULK_LOGS: (name: string, serviceName: string) =>
    `/stacks/${name}/services/${serviceName}/bulk-logs`,
  STACK_LOGS: (name: string) => `/stacks/${name}/logs`,

  // Networks
  NETWORKS: "/networks",
  NETWORK: (id: string) => `/networks/${id}`,
};

export const RESOURCE_LIMITS = {
  CPU_PER_CONTAINER: "1.0 CPU",
  MEMORY_PER_CONTAINER: "2GB",
  CPU_RESERVATION: "0.25 CPU",
  MEMORY_RESERVATION: "512MB",
};
