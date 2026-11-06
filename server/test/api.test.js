import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import request from "supertest";
import { config } from "../src/config.js";
import { createApp } from "../src/app.js";
const schema = `sweety_test_${process.pid}`;
const admin = new pg.Pool({ connectionString: config.databaseUrl });
const db = new pg.Pool({
  connectionString: config.databaseUrl,
  options: `-c search_path=${schema}`,
});
const app = createApp({
  db,
  jwtSecret: "test-only-secret-not-for-real-use-12345",
});
const server = app.listen(0);
const alice = request.agent(server),
  bob = request.agent(server);
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  await db.query(
    await readFile(new URL("../sql/001_init.sql", import.meta.url), "utf8"),
  );
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
});
test("real PostgreSQL API: authentication, isolation, edits and concurrent constraints", async (t) => {
  const payload = { date: "2026-01-15", slot: "After lunch", value: 123 };
  let id;
  await t.test(
    "registration hashes passwords, normalizes emails and sets a private cookie",
    async () => {
      const response = await alice
        .post("/api/auth/register")
        .send({
          name: "Alice",
          email: "Alice@Example.com",
          password: "a-test-password",
        })
        .expect(201);
      assert.match(response.headers["set-cookie"][0], /HttpOnly/);
      const { rows } = await db.query(
        "SELECT password_hash,email FROM users WHERE name='Alice'",
      );
      assert.match(rows[0].password_hash, /^\$2/);
      assert.equal(rows[0].email, "alice@example.com");
      await bob
        .post("/api/auth/register")
        .send({
          name: "Bob",
          email: "bob@example.com",
          password: "b-test-password",
        })
        .expect(201);
      await request(app).get("/api/reports?date=2026-01-15").expect(401);
      await request(app)
        .post("/api/auth/login")
        .send({ email: "alice@example.com", password: "wrong" })
        .expect(401);
      await request(app)
        .post("/api/auth/login")
        .send({ email: "ALICE@example.com", password: "a-test-password" })
        .expect(200);
    },
  );
  await t.test(
    "invalid requests fail clearly; create and duplicate checks work",
    async () => {
      for (const value of ["", 39, 601, 1.2])
        await alice
          .post("/api/readings")
          .send({ ...payload, value })
          .expect(400);
      await alice
        .post("/api/readings")
        .send({ ...payload, date: "2999-01-01" })
        .expect(400);
      const response = await alice
        .post("/api/readings")
        .send(payload)
        .expect(201);
      id = response.body.reading.id;
      await alice.post("/api/readings").send(payload).expect(409);
    },
  );
  await t.test(
    "other users cannot list, report, update or delete Alice’s readings",
    async () => {
      assert.deepEqual(
        (await bob.get("/api/readings?date=2026-01-15").expect(200)).body
          .readings,
        [],
      );
      assert.equal(
        (await bob.get("/api/reports?date=2026-01-15").expect(200)).body.daily
          .count,
        0,
      );
      await bob
        .put(`/api/readings/${id}`)
        .send({ ...payload, value: 200 })
        .expect(404);
      await bob.delete(`/api/readings/${id}`).expect(404);
    },
  );
  await t.test(
    "edit validates conflicts and report calculations update after writes",
    async () => {
      await alice
        .post("/api/readings")
        .send({ ...payload, slot: "After dinner", value: 124 })
        .expect(201);
      await alice
        .put(`/api/readings/${id}`)
        .send({ ...payload, slot: "After dinner" })
        .expect(409);
      await alice
        .put(`/api/readings/${id}`)
        .send({ ...payload, date: "2999-01-01" })
        .expect(400);
      await alice
        .put(`/api/readings/${id}`)
        .send({ ...payload, value: 100 })
        .expect(200);
      const report = (
        await alice.get("/api/reports?date=2026-01-15").expect(200)
      ).body.daily;
      assert.equal(report.count, 2);
      assert.equal(report.average, 112);
      assert.equal(report.lowest, 100);
      await alice.delete(`/api/readings/${id}`).expect(204);
      assert.equal(
        (await alice.get("/api/reports?date=2026-01-15")).body.daily.count,
        1,
      );
    },
  );
  await t.test(
    "concurrent creates leave one row per slot and at most four per day",
    async () => {
      const slots = [
        "Morning (fasting)",
        "After breakfast",
        "After lunch",
        "After dinner",
      ];
      const responses = await Promise.all(
        slots.flatMap((slot) =>
          [1, 2, 3].map(() =>
            alice
              .post("/api/readings")
              .send({ ...payload, date: "2026-01-16", slot }),
          ),
        ),
      );
      assert.equal(responses.filter((r) => r.status === 201).length, 4);
      assert.ok(responses.every((r) => [201, 409].includes(r.status)));
      assert.equal(
        (await alice.get("/api/readings?date=2026-01-16")).body.readings.length,
        4,
      );
    },
  );
  await t.test(
    "database rejects invalid values, slots and future dates independently",
    async () => {
      const user = (await db.query("SELECT id FROM users WHERE name='Alice'"))
        .rows[0].id;
      for (const [date, slot, value] of [
        ["2026-01-01", "After lunch", 601],
        ["2026-01-01", "Invalid", 100],
        ["2999-01-01", "After lunch", 100],
      ]) {
        await assert.rejects(
          db.query(
            "INSERT INTO readings(user_id,reading_date,slot,value_mg_dl) VALUES ($1,$2,$3,$4)",
            [user, date, slot, value],
          ),
          { code: "23514" },
        );
      }
      await alice.post("/api/auth/logout").send({}).expect(200);
      await alice.get("/api/auth/me").expect(401);
    },
  );
});
