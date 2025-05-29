"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStackRoutes = void 0;
const express_1 = require("express");
const stackController_1 = require("../controllers/stackController");
const stackController = new stackController_1.StackController();
const setStackRoutes = (app) => {
    const router = (0, express_1.Router)();
    // Core stack operations
    router.post("/", stackController.createStack.bind(stackController));
    router.get("/", stackController.listStacks.bind(stackController));
    router.get("/:name", stackController.getStack.bind(stackController));
    router.put("/:name", stackController.updateStack.bind(stackController));
    router.delete("/:name", stackController.deleteStack.bind(stackController));
    // Stack service operations
    router.get("/:name/services", stackController.getStackServices.bind(stackController));
    router.post("/:name/services/:serviceName/scale", stackController.scaleStackService.bind(stackController));
    // Stack logs
    router.get("/:name/logs", stackController.getStackLogs.bind(stackController));
    // Legacy support for ID-based routes (backward compatibility)
    router.get("/id/:id", stackController.getStack.bind(stackController));
    router.put("/id/:id", stackController.updateStack.bind(stackController));
    router.delete("/id/:id", stackController.deleteStack.bind(stackController));
    app.use("/api/stacks", router);
};
exports.setStackRoutes = setStackRoutes;
