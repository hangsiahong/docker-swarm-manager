"use strict";
// import { Request, Response } from 'express';
// import { DockerService } from '../services/dockerService';
// export class SwarmController {
//     private dockerService: DockerService;
//     constructor() {
//         this.dockerService = new DockerService();
//     }
//     public initializeSwarm = async (req: Request, res: Response): Promise<void> => {
//         try {
//             const result = await this.dockerService.initializeSwarmAPI();
//             res.status(200).json(result);
//         } catch (error) {
//             res.status(500).json({ message: 'Error initializing swarm', error });
//         }
//     };
//     public joinSwarm = async (req: Request, res: Response): Promise<void> => {
//         const { token } = req.body;
//         try {
//             const result = await this.dockerService.joinSwarmAPI(token);
//             res.status(200).json(result);
//         } catch (error) {
//             res.status(500).json({ message: 'Error joining swarm', error });
//         }
//     };
//     public leaveSwarm = async (req: Request, res: Response): Promise<void> => {
//         try {
//             const result = await this.dockerService.leaveSwarmAPI();
//             res.status(200).json(result);
//         } catch (error) {
//             res.status(500).json({ message: 'Error leaving swarm', error });
//         }
//     };
//     public getSwarmInfo = async (req: Request, res: Response): Promise<void> => {
//         try {
//             const result = await this.dockerService.getSwarmInfoAPI();
//             res.status(200).json(result);
//         } catch (error) {
//             res.status(500).json({ message: 'Error retrieving swarm info', error });
//         }
//     };
// }
