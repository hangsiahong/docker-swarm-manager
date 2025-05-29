"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStackRoutes = void 0;
const express_1 = require("express");
const stackController_1 = require("../controllers/stackController");
const stackController = new stackController_1.StackController();
const setStackRoutes = (app) => {
    const router = (0, express_1.Router)();
    router.post("/", stackController.createStack.bind(stackController));
    router.put("/:id", stackController.updateStack.bind(stackController));
    router.delete("/:id", stackController.deleteStack.bind(stackController));
    router.get("/", stackController.listStacks.bind(stackController));
    router.get("/:id", stackController.getStack.bind(stackController));
    app.use("/api/stacks", router);
};
exports.setStackRoutes = setStackRoutes;
