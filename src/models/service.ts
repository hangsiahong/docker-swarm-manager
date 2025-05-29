export interface Service {
  id: string;
  name: string;
  image: string;
  replicas: number;
  ports: Array<{
    target: number;
    published: number;
    protocol: string;
  }>;
  environment: Record<string, string>;
  networks: string[];
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
  updateConfig: {
    parallelism: number;
    delay: number;
  };
  rollbackConfig: {
    parallelism: number;
    delay: number;
  };
}
