# 星像学算法来源映射

## 1. 可审计来源

核心安盘规则不是从少量接口响应猜测。Java 实现的规则基线是 MIT 授权的 `iztro 2.5.8`（Copyright (c) 2023 All Contributors），原始 npm 包、解包后的必要源码、`package.json` 和 `LICENSE` 已完整固化在 `docs/xingxiang-golden/upstream/`。原包 URL、SHA-256、SHA-512、仓库地址和 attribution 记录在 `source-manifest.json`。

公农历、农历月日、年/月/日/时干支来自项目已锁定的 MIT 依赖 `cn.6tail:lunar:1.3.15`；版本锁位于 `services/paipan/pom.xml`，本机解析到的 JAR SHA-256 也已记录。Java Engine 的运行时只依赖该本地 Maven 依赖，不加载 npm 包，也不访问参考站。

## 2. Java 与上游规则对应

| Java `XingxiangEngine` | iztro 2.5.8 本地源码 | 对应范围 |
|---|---|---|
| `chart` 的命宫、身宫、五虎遁宫干 | `lib/astro/palace.js#getSoulAndBody`、`lib/data/constants.js#TIGER_RULE` | 农历月与时支安命身、十二宫干支 |
| `fiveElementsBureau` | `lib/astro/palace.js#getFiveElementsClass` | 命宫干支纳音五行局 |
| `placeMajorStars` | `lib/star/location.js#getStartIndex`、`lib/star/majorStar.js#getMajorStar` | 紫微/天府两星系共 14 主星 |
| `placeMinorStars` | `lib/star/location.js`、`lib/star/minorStar.js#getMinorStar` | 左右昌曲、魁钺、禄羊陀马、空劫火铃共 14 辅煞星 |
| `placeSelectedAdjectiveStars` | `lib/star/location.js#getTimelyStarIndex/getLuanXiIndex/getMonthlyStarIndex/getYearlyStarIndex`、`lib/star/adjectiveStar.js` | 参考页实际输出的台辅、封诰、红鸾、天喜、天姚、解神、天巫、天官、天福、天月、天刑、阴煞共 12 杂曜 |
| `MUTAGENS` / `transformations` / `branchOfStar` | `lib/data/heavenlyStems.js`、`lib/astro/analyzer.js#mutagensToStars` | 十天干禄权科忌及四颗目标星落宫；同一结构供大限、流年和宫干飞化使用 |
| `selfTransformations` | `lib/astro/FunctionalPalace.js#selfMutaged/fliesTo/mutagedPlaces` | 宫干四化落本宫或对宫；参考字段 `benGong` 固化方向语义 |
| `periods` / `palaceNamesAt` | `lib/astro/palace.js#getHoroscope/getPalaceNames`、`lib/astro/FunctionalAstrolabe.js` | 阳男阴女顺、阴男阳女逆，12 大限、虚岁与流年动态宫名/四化 |
| `flowMonths` | `lib/astro/FunctionalAstrolabe.js` 的流月索引规则、`lib/data/constants.js#TIGER_RULE` | 流年地支逆数生月、顺数生时定正月宫，随后逐月顺行；五虎遁定月干支 |
| 晚子时换日 | `lib/star/location.js#getStartIndex` 的 late-rat-day 处理 + 参考 case-03 | 23:00 起按次日农历日和日柱安盘，公历输入原样展示 |

本地 Java 对上游做的是类型化、最小范围移植，不把 npm 包作为生产运行依赖。亮度以 iztro 主星/昌曲/火铃羊陀表为基础；参考站额外展示的左右、空劫、禄存亮度作为显示元数据冻结，并由三例逐宫测试覆盖。

## 3. 全量星曜无静默删减

三份参考响应每份均恰好输出 40 颗星，且集合完全相同：

- 14 主星：紫微、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、天梁、七杀、破军。
- 14 辅煞星：左辅、右弼、文昌、文曲、天魁、天钺、禄存、天马、地空、地劫、火星、铃星、擎羊、陀罗。
- 12 杂曜：红鸾、天喜、天姚、解神、台辅、封诰、天巫、天官、天福、天月、天刑、阴煞。

Java Engine 对这 40 颗逐一安置，没有用页面可见性筛掉其中任何一颗。iztro 还支持但参考页三例均未返回的三台、八座、恩光、天贵等星曜，不属于当前原页功能，因此没有伪装成参考页既有功能；该差异已在功能矩阵中明示。

## 4. 黄金强度

`XingxiangReferenceParityTest` 直接读取三份冻结原始响应，逐例核对：

- 命造公历/农历、阴阳性别、五行局、四柱；
- 12 宫的宫名、宫干支、身宫/来因宫标记；
- 全部 40 颗星的宫位、亮度和生年四化；
- 每宫全部自化及本宫/对宫方向；
- 全部 12 大限的干支、年龄、起始年、动态 12 宫名与四化；
- 每限 10 流年，即共 120 流年的年龄、年份、干支、动态 12 宫名与四化。
- 每个流年的 12 个流月，即每例 1440 条、三例共 4320 条月份、月干支与落宫记录。
- 大限、流年和宫干飞化的四颗目标星都必须存在于声明的目标宫；自化方向必须满足 `benGong=true` 为自化出、`false` 为自化入。

三例分别覆盖阴男土五局、阳女木三局和阳男火六局晚子时；测试不是代表字段抽查，任一逐宫/星曜/运限差异都会失败。
