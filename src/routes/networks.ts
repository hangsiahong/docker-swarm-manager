import { Express, Router } from "express";
import { NetworkController } from "../controllers/networkController";

const networkController = new NetworkController();

export const setNetworkRoutes = (app: Express): void => {
  const router = Router();

  router.post("/", networkController.createNetwork.bind(networkController));
  router.get("/", networkController.listNetworks.bind(networkController));
  router.get("/:id", networkController.getNetwork.bind(networkController));
  router.delete(
    "/:id",
    networkController.deleteNetwork.bind(networkController)
  );

  app.use("/api/networks", router);
};
