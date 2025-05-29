import { Router } from "express";
import { ServiceController } from "../controllers/serviceController";

const router = Router();
const serviceController = new ServiceController();

export const setServiceRoutes = (app: any) => {
  app.use("/api/services", router);

  router.post("/", serviceController.createService.bind(serviceController));
  router.put("/:id", serviceController.updateService.bind(serviceController));
  router.delete(
    "/:id",
    serviceController.deleteService.bind(serviceController)
  );
  router.get("/", serviceController.listServices.bind(serviceController));
  router.get("/:id", serviceController.getService.bind(serviceController));
  router.post(
    "/:id/scale",
    serviceController.scaleService.bind(serviceController)
  );
  router.get(
    "/:id/logs",
    serviceController.getServiceLogs.bind(serviceController)
  );
};
