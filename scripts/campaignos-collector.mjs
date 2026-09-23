#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const get = (name, fallback = undefined) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const platform = String(get("platform", "instagram")).toLowerCase();
const query = String(get("query", "")).trim();
const limit = Math.max(1, Math.min(50, Number(get("limit", "10")) || 10));
const commentsPerPost = Math.max(0, Math.min(100, Number(get("comments", "20")) || 20));
const endpoint = get("endpoint");
const campaign = get("campaign", "BARAL CampaignOS research");
const objective = get("objective", "Mapear objeciones, riesgos, dudas y señales de conversión.");
const inputFile = get("input");
const out = resolve(get("out", `campaignos-run-${Date.now()}.json`));
const localSocai = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".tools", "socai", "socai.exe");
const socaiCommand = process.env.SOCAI_BIN || (existsSync(localSocai) ? localSocai : "socai");

if (endpoint) {
  let parsed;
  try { parsed = new URL(endpoint); } catch { die("--endpoint debe ser una URL válida."); }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) || !["http:", "https:"].includes(parsed.protocol)) {
    die("Por privacidad, el collector solo envía comentarios a un endpoint local. Usa el JSON local para el resto del flujo.");
  }
}

function die(message) {
  console.error(`\n[CampaignOS Collector] ${message}\n`);
  process.exit(1);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) die(result.error.message);
  if (result.status !== 0) die(result.stderr || `Command failed: ${command} ${commandArgs.join(" ")}`);
  return result.stdout.trim();
}

function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch {}
  const firstObject = text.indexOf("{");
  const firstArray = text.indexOf("[");
  const starts = [firstObject, firstArray].filter((value) => value >= 0);
  if (!starts.length) return { raw: text };
  const start = Math.min(...starts);
  try { return JSON.parse(text.slice(start)); } catch { return { raw: text }; }
}

function looksLikeCommentKey(key) {
  return /comment|comments|repl(y|ies)|responses|discussion/i.test(key);
}

function stringValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function numberValue(object, keys) {
  for (const key of keys) {
    const value = Number(object?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function normalizeDeep(root, defaultPlatform) {
  const records = [];
  const seen = new Set();

  function walk(node, path = [], parentUrl) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, path, parentUrl);
      return;
    }
    if (typeof node !== "object") return;

    const url = stringValue(node, ["url", "permalink", "post_url", "postUrl", "href", "shareUrl"]) || parentUrl;
    const text = stringValue(node, ["text", "comment", "content", "message", "body", "caption", "desc", "description"]);
    const pathSuggestsComment = path.some(looksLikeCommentKey);
    const objectSuggestsComment = ["commentId", "comment_id", "replyId", "reply_id"].some((key) => node[key] != null);

    if (text && (pathSuggestsComment || objectSuggestsComment)) {
      const author = stringValue(node, ["author", "username", "userName", "nickname", "displayName", "name"]);
      const rawId = stringValue(node, ["id", "commentId", "comment_id", "cid"]);
      const key = `${defaultPlatform}|${rawId || ""}|${author || ""}|${text}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({
          id: rawId || `${defaultPlatform}-${records.length + 1}`,
          platform: defaultPlatform,
          text,
          author,
          url,
          likes: numberValue(node, ["likes", "likeCount", "like_count", "digg_count"]),
          createdAt: stringValue(node, ["createdAt", "created_at", "publishedAt", "timestamp", "time"]),
          source: "socai",
        });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "object" && value !== null) walk(value, [...path, key], url);
    }
  }

  walk(root);
  return records;
}

function collectUrls(root) {
  const urls = [];
  const seen = new Set();
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && /url|href|permalink/i.test(key) && /^https?:\/\//.test(value)) {
        if (!seen.has(value)) { seen.add(value); urls.push(value); }
      } else if (typeof value === "object" && value !== null) walk(value);
    }
  }
  walk(root);
  return urls;
}

function buildSearchCommand() {
  if (!query) die("Falta --query para captura social o usa --input archivo.json.");
  if (!["instagram", "tiktok", "linkedin"].includes(platform)) {
    die("MVP nativo: instagram, tiktok, linkedin. Para otras fuentes usa --input JSON y el dashboard omnicanal.");
  }
  const commandArgs = [platform, "search", query, "--num", String(limit), "--pretty"];
  if (platform === "linkedin") commandArgs.splice(3, 0, "--type", "content");
  return commandArgs;
}

function fetchDetail(url) {
  if (platform === "instagram") return parseJsonLoose(run(socaiCommand, ["instagram", "get-posts", "--post", url, "--num-comments", String(commentsPerPost), "--pretty"]));
  if (platform === "linkedin") return parseJsonLoose(run(socaiCommand, ["linkedin", "get-posts", "--post", url, "--num-comments", String(commentsPerPost), "--pretty"]));
  if (platform === "tiktok") return parseJsonLoose(run(socaiCommand, ["tiktok", "get-videos", "--video", url, "--pretty"]));
  return null;
}

let rawEvidence;
let normalized;

if (inputFile) {
  rawEvidence = JSON.parse(readFileSync(resolve(inputFile), "utf8"));
  normalized = normalizeDeep(rawEvidence, platform === "file" ? "manual" : platform);
  if (!normalized.length && Array.isArray(rawEvidence?.comments)) normalized = rawEvidence.comments;
} else {
  const search = parseJsonLoose(run(socaiCommand, buildSearchCommand()));
  const urls = collectUrls(search).slice(0, Math.min(limit, 5));
  const details = [];
  for (const url of urls) {
    try { details.push({ url, data: fetchDetail(url) }); }
    catch (error) { details.push({ url, error: String(error) }); }
  }
  rawEvidence = { search, details };
  normalized = normalizeDeep(rawEvidence, platform);
}

const runRecord = {
  version: "campaignos-collector/0.1",
  capturedAt: new Date().toISOString(),
  campaign: { name: campaign, objective },
  platform,
  query: query || null,
  comments: normalized,
  evidence: flag("include-raw") ? rawEvidence : undefined,
  boundaries: {
    readOnly: true,
    browserSessionsRemainLocal: true,
    automatedPosting: false,
    bypassAccessControls: false,
  },
};

mkdirSync(resolve(out, ".."), { recursive: true });
writeFileSync(out, JSON.stringify(runRecord, null, 2));
console.log(`[CampaignOS Collector] ${normalized.length} comentarios normalizados → ${out}`);

if (endpoint) {
  const target = endpoint.replace(/\/$/, "") + "/api/campaignos/evaluate";
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign: runRecord.campaign, comments: normalized.slice(0, 24) }),
  });
  const analysis = await response.json();
  const analyzedPath = out.replace(/\.json$/i, "-analyzed.json");
  writeFileSync(analyzedPath, JSON.stringify({ ...runRecord, analysis }, null, 2));
  console.log(`[CampaignOS Collector] análisis remoto → ${analyzedPath}`);
  if (!response.ok) process.exitCode = 2;
}
