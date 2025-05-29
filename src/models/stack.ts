import { v4 as uuidv4 } from "uuid";

export interface StackService {
  name: string;
  image: string;
  replicas?: number;
  ports?: Array<{
    target: number;
    published: number;
    protocol?: string;
  }>;
  environment?: string[];
  networks?: string[];
  volumes?: string[];
  labels?: Record<string, string>;
  deploy?: {
    replicas?: number;
    update_config?: {
      parallelism?: number;
      delay?: string;
      order?: "stop-first" | "start-first";
      failure_action?: "pause" | "continue" | "rollback";
    };
    placement?: {
      constraints?: string[];
    };
  };
  // Resource limits are enforced automatically - not configurable by users
  resources: {
    limits: {
      cpus: string; // Fixed at "1.0" (1 CPU)
      memory: string; // Fixed at "2G" (2GB RAM)
    };
    reservations: {
      cpus: string; // Minimum reserved: "0.25" (0.25 CPU)
      memory: string; // Minimum reserved: "512M" (512MB RAM)
    };
  };
}

export interface StackNetwork {
  name: string;
  driver?: string;
  external?: boolean;
  attachable?: boolean;
}

export interface StackVolume {
  name: string;
  driver?: string;
  external?: boolean;
}

export interface Stack {
  id: string;
  name: string;
  version?: string;
  services: Record<string, StackService>;
  networks?: Record<string, StackNetwork>;
  volumes?: Record<string, StackVolume>;
  env?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  status?: "deploying" | "running" | "updating" | "error" | "stopped";

  // Methods for stack management
  updateServices(services: Record<string, StackService>): void;
  updateStatus(
    status: "deploying" | "running" | "updating" | "error" | "stopped"
  ): void;
}

export class StackModel implements Stack {
  id: string;
  name: string;
  version: string;
  services: Record<string, StackService>;
  networks?: Record<string, StackNetwork>;
  volumes?: Record<string, StackVolume>;
  env?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  status: "deploying" | "running" | "updating" | "error" | "stopped";

  constructor(
    name: string,
    services: Record<string, StackService> = {},
    networks?: Record<string, StackNetwork>,
    volumes?: Record<string, StackVolume>,
    env?: Record<string, string>
  ) {
    this.id = uuidv4();
    this.name = name;
    this.version = "3.8";
    this.services = this.enforceResourceLimits(services);
    this.networks = networks;
    this.volumes = volumes;
    this.env = env;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.status = "deploying";
  }

  /**
   * Enforces standardized resource limits on all services
   * All services get 1 CPU and 2GB RAM regardless of user input
   */
  private enforceResourceLimits(
    services: Record<string, StackService>
  ): Record<string, StackService> {
    const standardResources = {
      limits: {
        cpus: "1.0", // Fixed at 1 CPU
        memory: "2G", // Fixed at 2GB RAM
      },
      reservations: {
        cpus: "0.25", // Minimum 0.25 CPU
        memory: "512M", // Minimum 512MB RAM
      },
    };

    const processedServices: Record<string, StackService> = {};

    for (const [serviceName, service] of Object.entries(services)) {
      processedServices[serviceName] = {
        ...service,
        resources: standardResources, // Override any user-provided resources
      };
    }

    return processedServices;
  }

  updateServices(services: Record<string, StackService>) {
    this.services = this.enforceResourceLimits(services);
    this.updatedAt = new Date();
  }

  updateStatus(
    status: "deploying" | "running" | "updating" | "error" | "stopped"
  ) {
    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Returns standard resource limits for Docker service creation
   */
  static getStandardResourceLimits() {
    return {
      Limits: {
        NanoCPUs: 1000000000, // 1.0 CPU (1 billion nanocpus)
        MemoryBytes: 2147483648, // 2GB in bytes (2 * 1024 * 1024 * 1024)
      },
      Reservations: {
        NanoCPUs: 250000000, // 0.25 CPU minimum (250 million nanocpus)
        MemoryBytes: 536870912, // 512MB minimum (512 * 1024 * 1024)
      },
    };
  }
}
