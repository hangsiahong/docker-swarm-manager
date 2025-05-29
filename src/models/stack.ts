import { v4 as uuidv4 } from 'uuid';

export interface Stack {
    id: string;
    name: string;
    services: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class StackModel implements Stack {
    id: string;
    name: string;
    services: string[];
    createdAt: Date;
    updatedAt: Date;

    constructor(name: string, services: string[] = []) {
        this.id = uuidv4();
        this.name = name;
        this.services = services;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateServices(services: string[]) {
        this.services = services;
        this.updatedAt = new Date();
    }
}