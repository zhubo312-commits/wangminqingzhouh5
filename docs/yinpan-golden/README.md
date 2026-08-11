# 阴盘决策参考证据与黄金盘

采集日期：2026-08-12。参考入口为 `https://ft.bavor.cn/#/pages/yinpan/yinpan`，当前生产结果接口为 `GET /prod-api/app/qimen/getQimenH5`。

## 材料

- `source-manifest.json` 固化当前应用、表单、结果页及共享脚本的版本化 URL 与 SHA-256。
- `case-01/reference-request.json` 是无姓名、无事项的脱敏合法请求。
- `case-01/reference-original.json` 是参考站原始响应，不作为运行时外部依赖。
- `case-01/expected-summary.json` 固化用于跨实现核对的关键结果。
- `YinpanEngineTest` 直接用同一请求核对四柱、阴阳遁局、旬首、空亡、值符、值使、月将、马星、九宫与天门地户数量。

本地 Java 引擎复用仓库已冻结的 `QiMenZao.getYinPanQiMen` 与 `QimenPan.getQimenPan`。生产运行不访问参考站。

## 当前结论

case-01 的关键结果与参考响应一致：丙午、丙申、丁巳、辛亥，阴遁 9 局，旬首甲辰壬，值符天芮星落 6 宫，值使死门落 7 宫，马星巳落 4 宫，九宫与 12 组天门地户齐全。
