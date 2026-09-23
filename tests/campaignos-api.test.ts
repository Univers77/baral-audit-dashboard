import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/campaignos/evaluate/route";

const priorVercel = process.env.VERCEL;
after(() => {
  if (priorVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = priorVercel;
});

describe("CampaignOS evaluation boundary", () => {
  it("refuses cloud execution", async () => {
    process.env.VERCEL = "1";
    const request = new NextRequest("https://campaignos-preview.vercel.app/api/campaignos/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ comments: [{ text: "private input" }] }),
    });
    const response = await POST(request);
    assert.equal(response.status, 404);
  });

  it("rejects oversized local payloads before analysis", async () => {
    delete process.env.VERCEL;
    const request = new NextRequest("http://127.0.0.1:3000/api/campaignos/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(160_001),
    });
    const response = await POST(request);
    assert.equal(response.status, 413);
  });
});
