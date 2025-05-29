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
    updateConfig: {
        parallelism: number;
        delay: number;
    };
    rollbackConfig: {
        parallelism: number;
        delay: number;
    };
}