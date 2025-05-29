export interface Service {
    id: string;
    name: string;
    image: string;
    replicas: number;
    ports: Array<{ containerPort: number; hostPort?: number }>;
    environment?: Record<string, string>;
}

export interface Stack {
    id: string;
    name: string;
    services: Service[];
}

export interface SwarmNode {
    id: string;
    hostname: string;
    status: string;
    role: 'manager' | 'worker';
}

export interface Swarm {
    id: string;
    nodes: SwarmNode[];
    status: string;
}