package cn.bavor.guoxue.paipan.health;

import com.sunland.app.utils.bazi.SolarTimeUtil;
import com.sunland.app.utils.bazi.ShenShaDataUtil;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("algorithm")
public class AlgorithmHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        int areas = SolarTimeUtil.getProvinceCountry().size();
        int shenShaRules = ShenShaDataUtil.getShenShaList().size();
        if (areas == 0 || shenShaRules == 0) {
            return Health.down().withDetail("resources", "missing").build();
        }
        return Health.up()
                .withDetail("resources", "loaded")
                .withDetail("areaGroups", areas)
                .withDetail("shenShaRules", shenShaRules)
                .withDetail("lunarVersion", "1.3.15")
                .build();
    }
}
