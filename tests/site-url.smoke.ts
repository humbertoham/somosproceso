import assert from "node:assert/strict";

import { getSiteUrl } from "../src/lib/env";

const keys = ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
const originalValues = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function setSiteEnvironment(values: Partial<Record<(typeof keys)[number], string>>) {
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, values);
}

try {
  setSiteEnvironment({ NEXT_PUBLIC_SITE_URL: "example.com" });
  assert.equal(getSiteUrl(), "https://example.com");

  setSiteEnvironment({ NEXT_PUBLIC_SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "production.vercel.app", VERCEL_URL: "preview.vercel.app" });
  assert.equal(getSiteUrl(), "https://production.vercel.app");

  setSiteEnvironment({ NEXT_PUBLIC_SITE_URL: " ", VERCEL_PROJECT_PRODUCTION_URL: "", VERCEL_URL: "preview.vercel.app" });
  assert.equal(getSiteUrl(), "https://preview.vercel.app");

  setSiteEnvironment({ NEXT_PUBLIC_SITE_URL: "://", VERCEL_PROJECT_PRODUCTION_URL: "production.vercel.app" });
  assert.equal(getSiteUrl(), "https://production.vercel.app");

  setSiteEnvironment({});
  assert.equal(getSiteUrl(), "http://localhost:3000");

  setSiteEnvironment({ NEXT_PUBLIC_SITE_URL: " https://example.com/base/ " });
  assert.equal(getSiteUrl(), "https://example.com/base");
} finally {
  for (const key of keys) {
    const value = originalValues[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log("site URL fallbacks: ok");
