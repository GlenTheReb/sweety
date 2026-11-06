import bcrypt from "bcrypt";
import { pool } from "../src/db.js";
import { config } from "../src/config.js";
import { todayIn, reportRanges } from "../src/dates.js";
import { SLOTS } from "../src/validation.js";
if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 8)
  throw new Error("Set DEMO_PASSWORD to at least 8 characters.");
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query(
    "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id",
    [
      "Demo member",
      process.env.DEMO_EMAIL || "demo@sweety.local",
      await bcrypt.hash(process.env.DEMO_PASSWORD, 12),
    ],
  );
  const today = todayIn(config.timeZone);
  const dates = [
    today,
    `${today.slice(0, 7)}-01`,
    reportRanges(today).monthly.to,
  ];
  for (const date of new Set(dates))
    for (let i = 0; i < 4; i++) {
      await client.query(
        "INSERT INTO readings (user_id,reading_date,slot,value_mg_dl) VALUES ($1,$2,$3,$4) ON CONFLICT(user_id,reading_date,slot) DO NOTHING",
        [rows[0].id, date, SLOTS[i], [94, 132, 118, 126][i]],
      );
    }
  await client.query("COMMIT");
  console.log("Demo user and fictional sample readings ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
