# 数字规律（命理神数）参考证据与单样本冻结

采集日期：2026-08-12。参考入口为 `https://ft.bavor.cn/#/pages/minglishenshu/minglishenshu`，结果页为 `#/pages/minglishenshu/result/result`，生产结果接口为 `GET /prod-api/app/shenshu/getShenshu`。

## 材料与口径

- `source-manifest.json` 固化表单、结果页脚本的版本化 URL 与 SHA-256。
- `case-01/reference-request.json` 使用明确的合成姓名，不包含真实用户资料。
- `case-01/reference-original.json` 保存参考站原始响应，仅作为离线核验材料。
- `case-01/expected-summary.json` 只固化这一份参考响应的标准化摘要，不代表本地算法或全域黄金集已完成。
- 参考结果把 `specialArray` 用作“出现位置”、把 `occurrencePositions` 用作“特殊数组类别”，旧页面标签正好反置；单样本标准化摘要按实际语义记为 `position` 与 `category`。
- 本样本返回两条完全相同的特殊数组记录；在完整服务端规则取得前，不推断它们必然来自先天/后天各一次，也不在运行时代码中擅自合并。

## 证据边界与阻塞

- 表单脚本直接确认姓名、性别、生时和结果页 URL 参数；结果脚本直接确认接口、响应字段、模块顺序、无解读状态，以及完整的 1–12 五行显示映射。
- 先天数、后天数、阴阳、特殊数组和结果解读由参考站服务端接口生成，两个版本化前端脚本均不包含其完整规则。
- 当前仅一份脱敏响应，不能证明日期全域、换日/闰月、性别影响、十二数阴阳映射、特殊数组全集、位置差异或文案全集。
- 有限探索响应不能替代服务端源码、经确认规则规格或覆盖全域的授权黄金语料；不得据此猜测本地 Engine。
- 本材料不构成 Definition of Ready。P07 入口继续关闭，仓库运行时不访问参考站。

详细逐条审计与解除阻塞条件见 `docs/数字规律页面功能设计.md`。
