import { config, checkConfig } from "./config.js";
import { pool } from "./db.js";
import { createApp } from "./app.js";
checkConfig();
await pool.query("SELECT 1");
const app = createApp({
  db: pool,
  jwtSecret: config.jwtSecret,
  timeZone: config.timeZone,
});
app.listen(config.port, "127.0.0.1", () =>
  console.log(`Sweety API: http://127.0.0.1:${config.port}`),
);
