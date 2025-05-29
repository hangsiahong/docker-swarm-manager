export interface Service {
  ID: string;
  Version: { Index: number };
  CreatedAt: string;
  UpdatedAt: string;
  Spec: {
    Name: string;
    TaskTemplate: {
      ContainerSpec: {
        Image: string;
        Env?: string[];
      };
      Resources?: {
        Limits?: {
          NanoCPUs: number;
          MemoryBytes: number;
        };
        Reservations?: {
          NanoCPUs: number;
          MemoryBytes: number;
        };
      };
      Networks?: Array<{
        Target: string;
        Aliases?: string[];
      }>;
    };
    Mode: {
      Replicated?: { Replicas: number };
      Global?: {};
    };
    EndpointSpec?: {
      Ports?: Array<{
        Protocol: string;
        TargetPort: number;
        PublishedPort: number;
        PublishMode: string;
      }>;
    };
  };
}

export interface ServiceTask {
  ID: string;
  Version: { Index: number };
  CreatedAt: string;
  UpdatedAt: string;
  NodeID: string;
  ServiceID: string;
  Slot: number;
  Status: {
    Timestamp: string;
    State: string;
    Message?: string;
    ContainerStatus?: {
      ContainerID: string;
      PID: number;
    };
  };
  DesiredState: string;
}

export interface CreateServiceRequest {
  name: string;
  image: string;
  replicas?: number;
  ports?: Array<{
    target: number;
    published: number;
    protocol?: string;
    publishMode?: string;
  }>;
  env?: string[];
  labels?: Record<string, string>;
  networks?: string[];
  networkIds?: string[];
  networkOptions?: Record<
    string,
    {
      driver?: string;
      attachable?: boolean;
      aliases?: string[];
    }
  >;
}

export interface UpdateServiceRequest {
  image?: string;
  replicas?: number;
  env?: string[];
  labels?: Record<string, string>;
}

export interface ScaleServiceRequest {
  replicas: number;
}

export interface RollingUpdateRequest {
  image: string;
  updateConfig?: {
    parallelism?: number;
    delay?: string;
    failureAction?: string;
    order?: string;
  };
}

export interface StackListItem {
  id: string;
  name: string;
  status: string;
  services: number; // Number of services for list view
  createdAt: string;
  updatedAt?: string;
}

export interface Stack {
  id: string;
  name: string;
  status: string;
  services: Record<string, StackService>;
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

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
      order?: string;
      failure_action?: string;
    };
    placement?: {
      constraints?: string[];
    };
  };
}

export interface CreateStackRequest {
  name: string;
  version?: string;
  services: Record<string, StackService>;
  networks?: Record<
    string,
    {
      driver?: string;
      attachable?: boolean;
    }
  >;
  volumes?: Record<string, any>;
  env?: Record<string, string>;
}

export interface Network {
  Id: string;
  Name: string;
  Created: string;
  Scope: string;
  Driver: string;
  EnableIPv6: boolean;
  IPAM: {
    Driver: string;
    Options: Record<string, any>;
    Config: Array<{
      Subnet: string;
      Gateway?: string;
    }>;
  };
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  Options: Record<string, any>;
  Labels: Record<string, string>;
}

export interface CreateNetworkRequest {
  name: string;
  driver?: string;
  attachable?: boolean;
  options?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  stream?: string;
}

export interface ServiceReplica {
  replicaIndex: number;
  taskId: string;
  nodeId: string;
  status: string;
  image: string;
  createdAt: string;
}

export interface BulkLogsRequest {
  replicaIndexes: number[];
  tail?: number;
  timestamps?: boolean;
  maxConcurrent?: number;
}

export interface BulkLogsResponse {
  results: Array<{
    replicaIndex: number;
    status: "success" | "error";
    logs?: string;
    error?: string;
  }>;
  metadata: {
    requestedReplicas: number;
    successfulReplicas: number;
    failedReplicas: number;
    maxConcurrent: number;
    totalTime: string;
    note?: string;
  };
}

export interface ServiceCreateSpec {
  name: string;
  taskTemplate: {
    containerSpec: {
      image: string;
      env?: string[];
      command?: string[];
      args?: string[];
      mounts?: Array<{
        type: "bind" | "volume" | "tmpfs";
        source: string;
        target: string;
        readonly?: boolean;
      }>;
    };
    resources?: {
      limits?: {
        nanoCPUs: number;
        memoryBytes: number;
      };
      reservations?: {
        nanoCPUs: number;
        memoryBytes: number;
      };
    };
    placement?: {
      constraints?: string[];
    };
  };
  mode: {
    replicated?: {
      replicas: number;
    };
    global?: {};
  };
  endpointSpec?: {
    ports?: Array<{
      targetPort: number;
      publishedPort: number;
      protocol: "tcp" | "udp";
    }>;
  };
  networks?: Array<{
    target: string;
  }>;
  labels?: Record<string, string>;
}

export interface NetworkCreateSpec {
  name: string;
  driver: string;
  internal?: boolean;
  attachable?: boolean;
  ingress?: boolean;
  scope?: string;
  ipam?: {
    driver: string;
    config?: Array<{
      subnet?: string;
      gateway?: string;
      ipRange?: string;
    }>;
  };
  options?: Record<string, string>;
  labels?: Record<string, string>;
}
