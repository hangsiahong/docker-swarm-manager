"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const services_1 = require("./routes/services");
const stacks_1 = require("./routes/stacks");
const networks_1 = require("./routes/networks");
// import { setSwarmRoutes } from "./routes/swarm";
const logger_1 = __importDefault(require("./utils/logger"));
const config_1 = __importDefault(require("./utils/config"));
const app = (0, express_1.default)();
const PORT = config_1.default.port || 3456;
// Middleware
app.use((0, body_parser_1.json)());
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.url}`);
    next();
});
// Routes
(0, services_1.setServiceRoutes)(app);
(0, stacks_1.setStackRoutes)(app);
(0, networks_1.setNetworkRoutes)(app);
// setSwarmRoutes(app);
// Start the server
app.listen(PORT, () => {
    logger_1.default.info(`Server is running on port ${PORT}`);
});
