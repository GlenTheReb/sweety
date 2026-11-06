import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { parseDate, todayIn, reportRanges } from "./dates.js";
import { validateReading } from "./validation.js";
import { buildReports } from "./reports.js";

const columns =
  "id, to_char(reading_date, 'YYYY-MM-DD') AS date, slot, value_mg_dl AS value";
const duplicateMessage = (slot) =>
  `You already have ${slot.startsWith("After") ? "an" : "a"} ${slot} reading for this date.`;
export function createApp({ db, jwtSecret, timeZone = "Asia/Kolkata" }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }), cookieParser());
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (
      ["POST", "PUT"].includes(req.method) &&
      req.path !== "/auth/logout" &&
      (!req.is("application/json") || !req.body || Array.isArray(req.body))
    ) {
      return res.status(400).json({ error: "Send a JSON object." });
    }
    next();
  });
  const cookie = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
  };
  const login = (res, user) => {
    res.cookie(
      "sweety_session",
      jwt.sign({}, jwtSecret, { subject: String(user.id), expiresIn: "7d" }),
      { ...cookie, maxAge: 604800000 },
    );
    return { id: user.id, name: user.name, email: user.email };
  };
  app.get("/api/health", async (_req, res) => {
    await db.query("SELECT 1");
    res.json({ ok: true });
  });
  app.post("/api/auth/register", async (req, res, next) => {
    const { name, password } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    if (typeof name !== "string" || !name.trim() || name.length > 100)
      return res
        .status(400)
        .json({ error: "Enter a name of 1–100 characters." });
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return res.status(400).json({ error: "Enter a valid email address." });
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password) > 72
    )
      return res.status(400).json({
        error: "Password must be at least 8 characters and at most 72 bytes.",
      });
    try {
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await db.query(
        "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email",
        [name.trim(), email.trim().toLowerCase(), hash],
      );
      res.status(201).json({ user: login(res, rows[0]) });
    } catch (error) {
      if (error.code === "23505")
        return res
          .status(409)
          .json({ error: "An account already uses this email." });
      next(error);
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string")
      return res.status(400).json({ error: "Enter your email and password." });
    const { rows } = await db.query("SELECT * FROM users WHERE email=$1", [
      email.trim().toLowerCase(),
    ]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({ error: "Email or password is incorrect." });
    res.json({ user: login(res, rows[0]) });
  });
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("sweety_session", cookie).json({ ok: true });
  });
  app.use("/api", (req, res, next) => {
    try {
      req.userId = jwt.verify(req.cookies.sweety_session, jwtSecret, {
        algorithms: ["HS256"],
      }).sub;
      next();
    } catch {
      res.status(401).json({ error: "Please log in to continue." });
    }
  });
  app.get("/api/auth/me", async (req, res) => {
    const { rows } = await db.query(
      "SELECT id,name,email FROM users WHERE id=$1",
      [req.userId],
    );
    if (!rows[0])
      return res.status(401).json({ error: "Please log in again." });
    res.json({ user: rows[0], today: todayIn(timeZone) });
  });
  const validDate = (date) => parseDate(date) && date <= todayIn(timeZone);
  app.get("/api/readings", async (req, res) => {
    if (!validDate(req.query.date))
      return res
        .status(400)
        .json({ error: "Choose a valid date that is not in the future." });
    const { rows } = await db.query(
      `SELECT ${columns} FROM readings WHERE user_id=$1 AND reading_date=$2 ORDER BY id`,
      [req.userId, req.query.date],
    );
    res.json({ readings: rows });
  });
  const saveReading = async (req, res, next) => {
    const error = validateReading(req.body, todayIn(timeZone));
    if (error) return res.status(400).json({ error });
    const id = req.params.id;
    if (id && !/^[1-9]\d{0,17}$/.test(id))
      return res.status(404).json({ error: "Reading not found." });
    const { date, slot, value } = req.body;
    try {
      if (id) {
        const existing = await db.query(
          "SELECT id FROM readings WHERE id=$1 AND user_id=$2",
          [id, req.userId],
        );
        if (!existing.rowCount)
          return res.status(404).json({ error: "Reading not found." });
      }
      const { rows } = await db.query(
        "SELECT slot FROM readings WHERE user_id=$1 AND reading_date=$2 AND ($3::bigint IS NULL OR id<>$3)",
        [req.userId, date, id || null],
      );
      if (rows.length >= 4)
        return res
          .status(409)
          .json({ error: "You can add only 4 readings per day." });
      if (rows.some((r) => r.slot === slot))
        return res.status(409).json({
          error: duplicateMessage(slot),
        });
      const result = id
        ? await db.query(
            `UPDATE readings SET reading_date=$1,slot=$2,value_mg_dl=$3 WHERE id=$4 AND user_id=$5 RETURNING ${columns}`,
            [date, slot, Number(value), id, req.userId],
          )
        : await db.query(
            `INSERT INTO readings (reading_date,slot,value_mg_dl,user_id) VALUES ($1,$2,$3,$4) RETURNING ${columns}`,
            [date, slot, Number(value), req.userId],
          );
      if (!result.rowCount)
        return res.status(404).json({ error: "Reading not found." });
      res.status(id ? 200 : 201).json({ reading: result.rows[0] });
    } catch (error) {
      if (error.code === "23505")
        return res.status(409).json({
          error: duplicateMessage(slot),
        });
      if (error.code === "23514")
        return res.status(400).json({
          error: "The reading does not meet the date, slot or value rules.",
        });
      next(error);
    }
  };
  app.post("/api/readings", saveReading);
  app.put("/api/readings/:id", saveReading);
  app.delete("/api/readings/:id", async (req, res) => {
    if (!/^[1-9]\d{0,17}$/.test(req.params.id))
      return res.status(404).json({ error: "Reading not found." });
    const result = await db.query(
      "DELETE FROM readings WHERE id=$1 AND user_id=$2",
      [req.params.id, req.userId],
    );
    if (!result.rowCount)
      return res.status(404).json({ error: "Reading not found." });
    res.status(204).end();
  });
  app.get("/api/reports", async (req, res) => {
    const date = req.query.date;
    if (!validDate(date))
      return res
        .status(400)
        .json({ error: "Choose a valid date that is not in the future." });
    const ranges = reportRanges(date);
    const { rows } = await db.query(
      `SELECT ${columns} FROM readings WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3 ORDER BY reading_date,id`,
      [req.userId, ranges.monthly.from, date],
    );
    res.json(buildReports(date, rows));
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError || error.type === "entity.too.large")
      return res
        .status(400)
        .json({ error: "Send a valid, small JSON request." });
    console.error(error.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  });
  return app;
}
