# 逻辑学（六爻）参考证据与黄金盘

采集日期：2026-08-12。参考入口为 `https://ft.bavor.cn/#/pages/liuyao/liuyaopaipan`，结果接口为 `GET /prod-api/app/getLiuYao`；盘名起盘使用 `GET /prod-api/app/getGuaYao`。

## 材料

- `source-manifest.json` 固化入口、三种起盘表单和结果页脚本的版本化 URL 与 SHA-256。
- `case-01/reference-request.json` 是无姓名、无事项的固定六位硬币背数请求。六位顺序为初爻到上爻；参考页面在请求前反转为接口的 `a` 到 `f`。
- `case-01/reference-original.json` 是参考站原始响应，不作为运行时依赖。
- `case-01/expected-summary.json` 固化本卦、变卦、八宫、世应、日空、六神、伏神、六亲和纳甲关键值。
- `LuojiEngineTest` 用同一组输入逐项核对参考响应，并覆盖盘名起盘和非法卦名。

本地 Java 引擎实现硬币阴阳与动爻、八宫归属、世应、纳甲、六亲、六神和伏神计算。生产运行不访问参考站。

## 当前结论

case-01 背数 `312101` 在参考实现中得到火泽睽之天水讼：本卦归艮宫第 5 卦，四爻持世、初爻为应；变卦归离宫第 7 卦（游魂）。丁日六神自上而下为青龙、玄武、白虎、螣蛇、勾陈、朱雀，五爻伏妻财丙子，日空子丑。
