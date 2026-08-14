#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const EXPECTED_SOURCES = Object.freeze({
  yp81: "20145ccb397dbb074e266a15b2891dda5fdbc39808ceb840308f2fb61e732e2e",
  sancai: "b9332f5191f647e3038481d7ecfbfcd54bdbe75866ef9e3ef56ed167fe04ad54",
});
const ELEMENTS = ["金", "木", "水", "火", "土"];

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`缺少 --${name}`);
  return path.resolve(process.argv[index + 1]);
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function parseValueList(source) {
  const values = [];
  let token = "";
  let quoted = false;
  let inString = false;
  let closedString = false;
  let escaped = false;

  const push = () => {
    if (inString) throw new Error("SQL 字符串没有闭合");
    if (quoted) values.push(token);
    else {
      const normalized = token.trim();
      if (normalized === "NULL") values.push(null);
      else if (/^-?\d+$/.test(normalized)) values.push(Number(normalized));
      else throw new Error(`不支持的 SQL 值：${normalized}`);
    }
    token = "";
    quoted = false;
    closedString = false;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) {
        const escapes = { "0": "\0", b: "\b", n: "\n", r: "\r", t: "\t", Z: "\u001a" };
        token += escapes[character] ?? character;
        escaped = false;
      } else if (character === "\\") escaped = true;
      else if (character === "'" && source[index + 1] === "'") {
        token += "'";
        index += 1;
      } else if (character === "'") {
        inString = false;
        closedString = true;
      } else token += character;
      continue;
    }
    if (closedString) {
      if (character === ",") push();
      else if (!/\s/.test(character)) throw new Error(`字符串后存在非法字符：${character}`);
      continue;
    }
    if (character === "'") {
      if (token.trim()) throw new Error("字符串前存在非法字符");
      token = "";
      quoted = true;
      inString = true;
    } else if (character === ",") push();
    else token += character;
  }
  push();
  return values;
}

function parseDump(buffer, table, expectedFields) {
  const prefix = `INSERT INTO \`${table}\` VALUES (`;
  return buffer.toString("utf8").split(/\r?\n/)
    .filter((line) => line.startsWith(prefix))
    .map((line, index) => {
      if (!line.endsWith(");")) throw new Error(`${table} 第 ${index + 1} 条 INSERT 未正常结束`);
      const values = parseValueList(line.slice(prefix.length, -2));
      if (values.length !== expectedFields) {
        throw new Error(`${table} 第 ${index + 1} 条字段数为 ${values.length}，预期 ${expectedFields}`);
      }
      return values;
    });
}

function assertUniqueComplete(values, expected, label) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([value]) => value);
  const missing = expected.filter((value) => !counts.has(value));
  if (duplicates.length || missing.length) {
    throw new Error(`${label} 不完整：missing=${missing.join(",")} duplicates=${duplicates.join(",")}`);
  }
}

function cleanText(value, label) {
  if (typeof value !== "string") throw new Error(`${label} 必须是字符串`);
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) throw new Error(`${label} 不得为空`);
  return cleaned;
}

function sqlText(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function renderRows(table, columns, rows) {
  const rendered = rows.map((row) => `    (${row.map((value) => typeof value === "number" ? value : sqlText(value)).join(", ")})`);
  return `INSERT INTO ${table} (${columns.join(", ")})\nVALUES\n${rendered.join(",\n")};\n`;
}

function main() {
  const yp81Path = option("yp81");
  const sancaiPath = option("sancai");
  const outputPath = option("output");
  const yp81Buffer = readFileSync(yp81Path);
  const sancaiBuffer = readFileSync(sancaiPath);
  const hashes = { yp81: sha256(yp81Buffer), sancai: sha256(sancaiBuffer) };
  for (const key of Object.keys(EXPECTED_SOURCES)) {
    if (hashes[key] !== EXPECTED_SOURCES[key]) {
      throw new Error(`${key} SHA-256 不匹配：${hashes[key]}`);
    }
  }

  const raw81 = parseDump(yp81Buffer, "yp_81", 5);
  const unexpected81 = raw81.filter((row) => !Number.isInteger(row[0]) || row[0] < 1 || row[0] > 81);
  if (unexpected81.length !== 1 || unexpected81[0][0] !== 999 || unexpected81[0][2]?.trim() !== "ba") {
    throw new Error("yp_81 的范围外数据不符合已审计的 num=999 测试脏数据");
  }
  const rows81 = raw81.filter((row) => row[0] >= 1 && row[0] <= 81)
    .map((row) => [row[0], ...row.slice(1).map((value, index) => cleanText(value, `yp_81.${index + 1}`))])
    .sort((left, right) => left[0] - right[0]);
  assertUniqueComplete(rows81.map((row) => row[0]), Array.from({ length: 81 }, (_, index) => index + 1), "yp_81.num");

  const expectedTitles = ELEMENTS.flatMap((first) => ELEMENTS.flatMap((second) =>
    ELEMENTS.map((third) => `${first}${second}${third}`)));
  const rowsSancai = parseDump(sancaiBuffer, "yp_sancai", 13)
    .map((row) => row.map((value, index) => cleanText(value, `yp_sancai.${index}`)))
    .sort((left, right) => expectedTitles.indexOf(left[0]) - expectedTitles.indexOf(right[0]));
  assertUniqueComplete(rowsSancai.map((row) => row[0]), expectedTitles, "yp_sancai.title");

  const header = `-- GENERATED FILE. DO NOT EDIT BY HAND.\n` +
    `-- Sources: developer-provided MySQL exports; raw dumps are not committed or executed.\n` +
    `-- yp_81 source SHA-256: ${hashes.yp81}; accepted rows=81; rejected audited test row num=999.\n` +
    `-- yp_sancai source SHA-256: ${hashes.sancai}; accepted rows=125.\n` +
    `-- Normalization: MySQL escaping decoded, CRLF and HTML BR tags converted to plain-text newlines, edge whitespace trimmed.\n\n`;
  const sql = header + renderRows("yp_81", ["num", "yy", "jx", "als", "content"], rows81) + "\n" +
    renderRows("yp_sancai", ["title", "yy", "jx", "content", "jcy", "jx1", "cgy", "jx2", "rjgx", "jx3", "xg", "sancai_liu_result", "sancai_liu_jx"], rowsSancai);
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, sql, { encoding: "utf8", flag: "wx" });
  renameSync(temporaryPath, outputPath);
  process.stdout.write(`${JSON.stringify({ output: outputPath, sha256: sha256(Buffer.from(sql)), yp81: rows81.length, sancai: rowsSancai.length })}\n`);
}

main();
