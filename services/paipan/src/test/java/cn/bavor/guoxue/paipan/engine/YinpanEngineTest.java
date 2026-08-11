package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.YinpanModels.*;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class YinpanEngineTest {
    private final YinpanEngine engine = new YinpanEngine(new BaziEngine());

    @Test
    void matchesTheReferenceTimeChartGoldenCase() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31",
                "male",
                "",
                "time",
                false));

        assertThat(chart.overview().method()).isEqualTo("时盘");
        assertThat(chart.overview().solarDateTime()).isEqualTo("2026-08-11 21:31");
        assertThat(chart.overview().lunarDate()).isEqualTo("二〇二六年六月廿九日");
        assertThat(chart.overview().pillars()).isEqualTo(new Pillars("丙午", "丙申", "丁巳", "辛亥"));
        assertThat(chart.overview().dunType()).isEqualTo("阴");
        assertThat(chart.overview().juNumber()).isEqualTo(9);
        assertThat(chart.overview().xunShou()).isEqualTo("甲辰壬");
        assertThat(chart.overview().voidBranches()).isEqualTo("寅卯");
        assertThat(chart.overview().chiefStar()).isEqualTo(new Chief("天芮星", 6));
        assertThat(chart.overview().chiefDoor()).isEqualTo(new Chief("死", 7));
        assertThat(chart.overview().monthGeneral()).isEqualTo("午");
        assertThat(chart.overview().horse()).isEqualTo(new Horse("巳", 4));
        assertThat(chart.palaces()).hasSize(9);
        assertThat(chart.palaces()).extracting(Palace::index).containsExactlyInAnyOrder(1, 2, 3, 4, 5, 6, 7, 8, 9);
        assertThat(chart.palaces()).filteredOn(Palace::isHorse).extracting(Palace::index).containsExactly(4);
        assertThat(chart.palaces()).filteredOn(Palace::isChief).extracting(Palace::index).containsExactly(6);
        assertThat(chart.palaces()).filteredOn(Palace::isChiefDoor).extracting(Palace::index).containsExactly(7);
        assertThat(chart.heavenEarthGates()).hasSize(12);
        assertThat(chart.lifetimeChart()).isNull();
    }

    @Test
    void supportsKeChartsQuestionsAndOptionalLifetimeData() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31",
                "female",
                "  测试事项  ",
                "ke",
                true));

        assertThat(chart.overview().method()).isEqualTo("刻盘");
        assertThat(chart.overview().question()).isEqualTo("测试事项");
        assertThat(chart.overview().gender()).isEqualTo("female");
        assertThat(chart.lifetimeChart()).isNotNull();
        assertThat(chart.lifetimeChart().profile().gender()).isEqualTo("female");
        assertThat(chart.lifetimeChart().profile().areaCode()).isEqualTo("999999");
    }
}
