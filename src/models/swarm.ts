export interface Swarm {
    id: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    spec: {
        name: string;
        labels: Record<string, string>;
        taskTemplate: {
            containerSpec: {
                image: string;
                args?: string[];
                env?: string[];
                resources?: {
                    limits?: {
                        cpus?: number;
                        memory?: string;
                    };
                    reservations?: {
                        cpus?: number;
                        memory?: string;
                    };
                };
            };
            mode: {
                replicated: {
                    replicas: number;
                };
            };
        };
        endpointSpec: {
            mode: string;
            ports: Array<{
                publishedPort: number;
                targetPort: number;
                protocol: string;
            }>;
        };
    };
}