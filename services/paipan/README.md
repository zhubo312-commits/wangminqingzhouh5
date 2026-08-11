# 生平子时排盘服务

无状态的内部 Java 服务，仅由 Fastify 通过 Docker 网络调用。

## 固定基线

- 算法源码：`minoltaMF/sunland` 的 `master@5cae297b596f728ccee78ed466f3f143b6cb7a79`。
- 前端功能边界：`minoltaMF/yipu-h5` 的 `newConcern@ab1a7fe9c83d289c0609c8d16cbea11873c726e4`。
- 日历依赖：`cn.6tail:lunar:1.3.15`。
- 运行时：Java 17、Spring Boot 3.5.16。

先以金标测试保证迁移结果一致。升级旧算法或 lunar 版本时，必须单独评估并更新金标。

## 范围

保留四柱、十神、藏干、星运、自坐、纳音、空亡、神煞、干支留意、大运、流年、流月、真太阳时、地区与旺衰参考。流日、流时、姓名解释、广告、付费、关注校验、登录、订单、MySQL、Redis 和日志切面不在本服务中。

## 验证

```bash
mvn verify
```

健康检查为 `GET /actuator/health`；业务接口统一位于 `/internal/v1/bazi/*`，不直接公开给浏览器。
