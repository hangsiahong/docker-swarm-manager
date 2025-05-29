import express from "express";
import { json } from "body-parser";
import { setServiceRoutes } from "./routes/services";
import { setStackRoutes } from "./routes/stacks";
import { setNetworkRoutes } from "./routes/networks";
// import { setSwarmRoutes } from "./routes/swarm";
import logger from "./utils/logger";
import config from "./utils/config";

const app = express();
const PORT = config.port || 3456;

// Middleware
app.use(json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
setServiceRoutes(app);
setStackRoutes(app);
setNetworkRoutes(app);
// setSwarmRoutes(app);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
