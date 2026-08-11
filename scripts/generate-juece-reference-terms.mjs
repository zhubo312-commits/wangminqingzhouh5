import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.TZ = "Asia/Shanghai";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyRoot = process.env.LEGACY_JUECE_ROOT
  ?? "/tmp/yipu-h5-plan-019fefd7/yipu-h5-lengshan";
const calendar = require(path.join(legacyRoot, "pages/qimen/js/myCalendar.js"));
const termNames = [
  "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
  "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑",
  "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至",
];
const pad = (value) => String(value).padStart(2, "0");
const format = (date) => [
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
].join(" ");

const lines = ["year,term,date_time"];
for (let year = 1899; year <= 2101; year += 1) {
  for (let index = 0; index < termNames.length; index += 1) {
    lines.push(`${year},${termNames[index]},${format(calendar.getTermDate(year, index))}`);
  }
}

const output = path.join(
  repoRoot,
  "services/paipan/src/main/resources/juece-reference-solar-terms.csv",
);
await writeFile(output, `${lines.join("\n")}\n`);
console.log(`Generated ${lines.length - 1} reference solar terms in ${output}`);
