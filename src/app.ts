import express from "express";
import { json } from "body-parser";
import cors from "cors";
import { setServiceRoutes } from "./routes/services";
import { setStackRoutes } from "./routes/stacks";
import { setNetworkRoutes } from "./routes/networks";
// import { setSwarmRoutes } from "./routes/swarm";
import logger from "./utils/logger";
import config from "./utils/config";

const app = express();
const PORT = config.port || 3456;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.1.101:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://192.168.1.101:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
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
