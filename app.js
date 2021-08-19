import express from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import dotenv from "dotenv";
import { accessLogStream } from "./helpers/logging.js";
dotenv.config();

import configRoutes from "./routes/index.js";

const server = express();

Sentry.init({
  dsn: process.env.SENTRY_URL,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ server }),
  ],
  tracesSampleRate: 1.0,
});
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(Sentry.Handlers.requestHandler());
server.use(Sentry.Handlers.tracingHandler());
server.use(cors());
server.use(compression());
server.use(morgan("combined", { stream: accessLogStream }));

configRoutes(server);

server.use(Sentry.Handlers.errorHandler());

// eslint-disable-next-line no-unused-vars
server.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

export default server;
