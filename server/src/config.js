import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env", import.meta.url), quiet: true });

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT || 3001),
  timeZone: "Asia/Kolkata",
};

export function checkConfig() {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is required.");
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }
  new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone });
}
