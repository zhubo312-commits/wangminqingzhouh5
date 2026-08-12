# 山向决策黄金盘

状态：已通过本地算法与参考站黄金验收<br>
生成日期：2026-08-12<br>
唯一参考基准：`https://ft.bavor.cn/#/pages/shanxiang/shanxiang`<br>
算法标识：`shanxiang_juece`<br>
Schema：`guoxue.paipan.shanxiang_juece.v1`

`source-manifest.json` 固化参考站当前入口、表单、结果脚本及仓库本地算法源码 SHA-256。`case-01` 保存脱敏请求、当前接口三盘关键字段和本地黄金预期。

黄金例使用 2026 年、0 度，参考站返回 `0/5/10` 三盘。第一盘为丁山癸向、0~4 度、阴遁 7 局、丙午年、己丑时、甲申庚旬首、午未空；值符天芮星落 6 宫，值使死门落 9 宫，亥马落 6 宫，黄泉亥。Java `ShanxiangEngineTest` 同时锁定此例、7 度时 `5/0/10` 的优先顺序以及 360 度归一行为。

参考接口仅用于本次资料采集和验收，生产运行时不调用参考站。
