"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setServiceRoutes = void 0;
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const router = (0, express_1.Router)();
const serviceController = new serviceController_1.ServiceController();
const setServiceRoutes = (app) => {
    app.use("/api/services", router);
    router.post("/", serviceController.createService.bind(serviceController));
    router.put("/:id", serviceController.updateService.bind(serviceController));
    router.delete("/:id", serviceController.deleteService.bind(serviceController));
    router.get("/", serviceController.listServices.bind(serviceController));
};
exports.setServiceRoutes = setServiceRoutes;
