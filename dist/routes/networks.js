"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNetworkRoutes = void 0;
const express_1 = require("express");
const networkController_1 = require("../controllers/networkController");
const networkController = new networkController_1.NetworkController();
const setNetworkRoutes = (app) => {
    const router = (0, express_1.Router)();
    router.post("/", networkController.createNetwork.bind(networkController));
    router.get("/", networkController.listNetworks.bind(networkController));
    router.get("/:id", networkController.getNetwork.bind(networkController));
    router.delete("/:id", networkController.deleteNetwork.bind(networkController));
    app.use("/api/networks", router);
};
exports.setNetworkRoutes = setNetworkRoutes;
