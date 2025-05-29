import { Express, Router } from "express";
import { StackController } from "../controllers/stackController";

const stackController = new StackController();

export const setStackRoutes = (app: Express): void => {
  const router = Router();

  router.post("/", stackController.createStack.bind(stackController));
  router.put("/:id", stackController.updateStack.bind(stackController));
  router.delete("/:id", stackController.deleteStack.bind(stackController));
  router.get("/", stackController.listStacks.bind(stackController));
  router.get("/:id", stackController.getStack.bind(stackController));

  app.use("/api/stacks", router);
};
