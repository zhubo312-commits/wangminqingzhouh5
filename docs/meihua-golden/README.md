# 梅花学参考证据与黄金盘

采集日期：2026-08-12。参考入口为 `https://ft.bavor.cn/#/pages/meihua/meihua`。该页面在浏览器端完成起卦、互卦与变卦计算，没有单独的生产排盘接口。

## 材料

- `source-manifest.json` 固化主入口、四种起盘页、结果页和六十四卦原文页的版本化脚本 URL 与 SHA-256。
- `case-01/reference-request.json` 固化时间起盘输入。
- `case-01/reference-calculation.json` 固化从参考脚本提取的序数、取模、互卦与变卦中间值。
- `case-01/expected-summary.json` 固化跨实现核对所需的本卦、互卦、变卦、四柱与日柱空亡。
- `MeihuaEngineTest` 覆盖时间、两种报数流派、时辰参与、指定起盘与非法输入。
- `hexagrams.ts` 固化参考页面中 64 卦的卦辞、彖传、象传、用爻与六爻原文，生产运行不访问参考站。

## 当前结论

case-01 在参考算法中得到上卦兑、下卦坎、第六爻动：本卦泽水困，互卦风火家人，变卦天水讼。该页展示的是日柱丁巳的空亡“子丑”；这与阴盘页面按时柱展示的空亡口径不同。
