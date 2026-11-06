import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";
import bcrypt from "bcrypt";
import { config } from "../src/config.js";

test("demo seed normalizes email and reruns without duplicating readings", async () => {
  const schema = `sweety_seed_test_${process.pid}`;
  const admin = new pg.Pool({ connectionString: config.databaseUrl });
  const url = new URL(config.databaseUrl);
  url.searchParams.set("options", `-c search_path=${schema}`);
  const db = new pg.Pool({ connectionString: url.href });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await db.query(
      await readFile(new URL("../sql/001_init.sql", import.meta.url), "utf8"),
    );
    const env = {
      ...process.env,
      DATABASE_URL: url.href,
      MIGRATION_DATABASE_URL: url.href,
      DEMO_EMAIL: "  Demo@Example.Local  ",
      DEMO_PASSWORD: "seed-test-only-password",
    };
    let count;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL("../scripts/seed.js", import.meta.url))],
        { env, encoding: "utf8", timeout: 15000 },
      );
      assert.equal(result.status, 0, result.stderr);
      const readings = await db.query(
        "SELECT count(*)::int AS count FROM readings",
      );
      if (attempt === 0) count = readings.rows[0].count;
      else assert.equal(readings.rows[0].count, count);
    }
    assert.ok(count >= 12);
    const { rows } = await db.query("SELECT email,password_hash FROM users");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, "demo@example.local");
    assert.ok(await bcrypt.compare(env.DEMO_PASSWORD, rows[0].password_hash));
  } finally {
    await db.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
