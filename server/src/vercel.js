import { config, checkConfig } from "./config.js";
import { pool } from "./db.js";
import { createApp } from "./app.js";

let app;
export default function handler(req, res) {
  if (!app) {
    checkConfig();
    app = createApp({
      db: pool,
      jwtSecret: config.jwtSecret,
      timeZone: config.timeZone,
    });
  }
  return app(req, res);
}
